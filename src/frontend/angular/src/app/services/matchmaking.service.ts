import { Injectable } from '@angular/core';
import {AuthService, UserInfo} from './auth.service';
import { Subject, Observable} from 'rxjs';
import { Router } from '@angular/router';
import { State } from '../utils/state';

import { Ball, Block, Paddle, PaddleState} from '../pages/pong/pong.component';
import { GameManagerService,  Manager, MatchSettings, MatchState, OnlineMatchConfig, OnlineMatchManager, OnlineMatchSettings } from './game-config.service';
import { MapsName, MapsService } from './map.service';
import { toEnum } from '../utils/castEnum';
import { EventData, PongEventType } from '../utils/behaviour';
import { LogFilter, Logger } from '../utils/debug';

export enum GameType {
  Tournament = 'Tournament',
  Match = 'Match',
}

export enum MatchMakingState{
  Standby = 'standby',
  OnGame = 'on game',
}

export enum OnlineMatchState{
  Joining = 'joining', 
  Connecting = 'connecting',
  WaitingForPlayers = ' waiting for players',
  Starting = 'starting',
  Running = 'running',
  FinishedSuccess = 'finished success',
  HostDisconected = 'host disconnected',
  GameCrash = 'game crash',
  FailedToJoin = 'failed to join',
  Error = 'error',
}

export class MatchUpdate{
  paddles : Paddle[];
  balls : Ball[];
  blocks : Block[];
  id : number;
  constructor(paddles : Paddle[], balls : Ball[], blocks : Block[], id : number){
    this.paddles = paddles;
    this.balls = balls;
    this.blocks = blocks;
    this.id = id;
  }
  subscribeAllToManager(manager : Manager){
    this.balls.forEach(ball => ball.subscribeToManager(manager));
    this.paddles.forEach(paddle => paddle.subscribeToManager(manager));
    this.blocks.forEach(block => block.subscribeToManager(manager));
  }
  runTickBehaviour(delta : number){
    for (let i = 0; i < this.paddles.length; i++){
      this.paddles[i].tickBehaviour.runTick(delta);
    }
    for (let i = 0; i < this.balls.length; i++){
      this.balls[i].tickBehaviour.runTick(delta);
    }
    for (let i = 0; i < this.blocks.length; i++){
      this.blocks[i].tickBehaviour.runTick(delta);
    }
  }

  update(update : MatchUpdate){
    for (const [index, paddle] of this.paddles.entries()){
      paddle.pos.copy(update.paddles[index].pos);
      paddle.dimmensions.copy(update.paddles[index].dimmensions);
      paddle.type = update.paddles[index].type;
      paddle.color = update.paddles[index].color;
      paddle.dir.copy(update.paddles[index].dir);
      paddle.speed = update.paddles[index].speed;
    }
    for (const [index, ball] of this.balls.entries()){
      ball.pos.copy(update.balls[index].pos);
      ball.dir.copy(update.balls[index].dir);
      ball.speed = update.balls[index].speed;
      ball.lightColor = update.balls[index].lightColor;
      ball.lightIntensity = update.balls[index].lightIntensity;
      ball.lightOn = update.balls[index].lightOn;
    }
    for (const [index, block] of this.blocks.entries()){
      block.pos.copy(update.blocks[index].pos);
      block.dimmensions.copy(update.blocks[index].dimmensions);
      block.type = update.blocks[index].type;
      block.material = update.blocks[index].material;
      block.speed = update.blocks[index].speed;
    }
  }
}

export class Score{
  score : [number, number];
  constructor(score : [number, number]){
    this.score = score;
  }
  scoreA(points : number){
    this.score[0] += points;
  }
  scoreB(points : number){
    this.score[1] += points;
  }
  changeScore(newScore : [number, number]){
    this.score = newScore;
  }
}

export enum OnlinePlayerState{
  Joining,
  Connecting,
  Connected,
  Disconected,
  Blocked
}

export class OnlinePlayer{
  state : State<OnlinePlayerState>;
  info : UserInfo;

  constructor(info : UserInfo, state : OnlinePlayerState = OnlinePlayerState.Connecting,
  ){
    this.state = new State(state);
    this.info = info;
  }
  getState(): OnlinePlayerState{
    return this.state.getCurrentValue();
  }
  changeState(state : OnlinePlayerState){
    this.state.setValue(state);
  }
}

export class GameSettings{
  gameType : GameType;
  name : string;
  tags : string;
  teamSize : number;
  winScore : number = 3;
  mapName : MapsName = MapsName.Default;
  publicGame : boolean;
  constructor( gameType : GameType, name : string, tags : string,
               publicGame: boolean, teamSize : number, mapName : MapsName){
    this.gameType = gameType;
    this.name = name;
    this.tags = tags;
    this.publicGame= publicGame;
    this.teamSize = teamSize;
    this.mapName = mapName;
  }
}

export interface MatchSync{
  sendMatchUpdate(update : MatchUpdate) : void;
  sendEvent(type : PongEventType, data : EventData): void;
  broadcastEvent(type : PongEventType, data : EventData): void;
}

@Injectable({
  providedIn: 'root'
})
export class MatchmakingService implements MatchSync{
  //backend connection
  webSocketUrl = 'wss://localhost:1501/ws/matchmaking/global/';
  webSocket! : WebSocket;

  //state of the service
  state : State<MatchMakingState> = new State<MatchMakingState>(MatchMakingState.Standby);
 
  //match connections
  maxCurrentPeerConnections : number = 0; 
  peerConnections : (Map<number,RTCPeerConnection> | RTCPeerConnection | undefined);
  dataChannels : (Map<number,RTCDataChannel> | RTCDataChannel | undefined);
 
  //info about the current matches available
  entries : Map<GameType, GameSettings[]> = new Map<GameType, GameSettings[]>;
  private dataChangedSubject: Subject<void> = new Subject<void>();
  dataChanged$: Observable<void> = this.dataChangedSubject.asObservable();

  //match manager
  private onlineManager? : OnlineMatchManager | undefined;

  //logger
  logger : Logger = new Logger(LogFilter.matchmakingServiceLogger, 'matchmaking :')

  constructor(private authService : AuthService,private router : Router, private maps : MapsService, private gameManager : GameManagerService){
    this.entries.set(GameType.Match, []);
    this.entries.set(GameType.Tournament,[]);
    this.connectToServer();
    if(this.isConnected()){
      this.sendMessage(JSON.stringify({type : '/getStatus'}));
    }
  }

  //GENERAL
  isConnected() : boolean{
    return this.webSocket?.readyState === WebSocket.OPEN;
  }

  getEntry(entry_name : string) : GameSettings[] | null{
    let type; 
    if (entry_name === GameType.Match)
      type = GameType.Match; 
    else if (entry_name === GameType.Tournament)
      type = GameType.Tournament; 
    else
      return null;
    const entry = this.entries.get(type);
    if (entry)
      return entry;
    return null;
  }

  getKeys() : string[]{
    return Array.from(this.entries.keys());
  }

  newGame(gameSettings : GameSettings){
    if (this.isConnected()){
      let messageObject;
      //!TODO
      this.logger.error('todo!!, must implement correct settings for match');
      if (gameSettings.gameType === GameType.Tournament){
        messageObject = { type: '/new_tournament', settings : gameSettings} ;
      } else if (gameSettings.gameType === GameType.Match){
        messageObject = { type: '/new_match', settings : gameSettings };
      }else
        return;
      this.sendMessage(JSON.stringify(messageObject));
      this.logger.info('new game called');
    }
  }

  reloadMatchesTournamets(){
    if (this.isConnected()){
      let messageObject = {type : '/match_tournament_list'};
      this.sendMessage(JSON.stringify(messageObject));
    }
  }

  async joinMatch(matchName : string){
    this.logger.info('join match called');
    if (this.isConnected()){
      if (this.onlineManager){
        this.logger.error('join match: already in match');
        return;
      }
      let messageObject = {
        type: '/join/match',
        name: matchName,
      }
      this.sendMessage(JSON.stringify(messageObject))
    }else
      this.logger.error('join match: failled to join match called');
  }

  sendMessage(message : string): boolean {
    if (this.isConnected()) {
      this.webSocket!.send(message); 
      return true;
    } else {
      this.logger.error('WebSocket connection is not open');
      return false;
    }
  }

  getCurrentMatchState() : OnlineMatchState | undefined{
    if(!this.onlineManager){
      //console.error('get current match state: online manager is undefined');
      return undefined;
    }
    return this.onlineManager.getOnlineState();
  }
  setCurrentMatchState(state : OnlineMatchState){
    if (this.onlineManager === undefined){
      this.logger.error('current game state is not initialized');
      return;
    }
    this.onlineManager.setOnlineMatchState(state);
    //!todo
    //if (state === OnlineMatchState.Running)
      this.onlineManager.setMatchState(MatchState.Running);
  }

  connectToServer() {
    if (this.isConnected())
      return;
    const jwtToken = this.authService.getCookie('access_token');
    if (jwtToken == null) {
      this.logger.info('failed to get cookie access token, log in');
    }
    this.webSocketUrl = `${this.webSocketUrl}?token=${jwtToken}`;
    this.webSocket = new WebSocket(this.webSocketUrl);
    this.webSocket.onopen = () => {
      this.logger.info('matchmaking : WebSocket connection opened');
    };
    this.webSocket.onerror = () => {
      this.logger.info('matchmaking: error on websocket')
    }
    this.webSocket.onclose = () => {
      this.logger.info('matchmaking: websocket closed')
    };
    this.webSocket.onmessage = (event) => {
      if (this.authService.user_info === undefined)
        return;
      const data = JSON.parse(event.data);
      this.logger.info('message of type ', data.type, ' received.')
      switch (data.type) {
        case 'status':
          switch (data.status){
            case 'Connected':
              this.state.setValue(MatchMakingState.Standby);
              break;
            case 'JoiningGame':
              this.state.setValue(MatchMakingState.OnGame);
              break;
            case 'InGame':
              this.state.setValue(MatchMakingState.OnGame);
              break;
            default:
              this.logger.error(`unknown status : ${data.status}`);
            }
          break;
        case 'new_match':
          this.entries.get(GameType.Match)
            ?.push(new GameSettings(GameType.Match, data.match.name, data.match.tags, true, 1, data.match.mapName));//!todo team size
          break;
        case 'new_tournament':
          this.entries.get(GameType.Tournament)
            ?.push(data.new_tournament_name)
          break;
        case 'del_tournament':
          const tournaments = this.entries.get(GameType.Tournament);
          if (tournaments) {
            const index = tournaments.indexOf(data.del_tournament_name);
            if (index !== -1) {
              tournaments.splice(index, 1);
            }
          }
          break;
        case 'del_match':
          const matches = this.entries.get(GameType.Match);
          if (matches) {
            const index = matches.indexOf(data.del_match_name);
            if (index !== -1) {
              matches.splice(index, 1);
            }
          }
          break;
        case 'match_tournament_list':
          this.entries.set(GameType.Match, data.matches);
          this.logger.info('match list received', data.matches);
          this.entries.set(GameType.Tournament, data.tournaments);
          break;
        case 'new_match_result':
          switch (data.status){
            case 'success':
              const mapSettings = this.maps.getMapSettings(data.match.mapName);
              if (!mapSettings){
                this.logger.error('failed to create match settings?');
                this.state.setValue(MatchMakingState.Standby);
                return;
              }
              //!todo this is trash
              const paddleStates : PaddleState[] = Array<PaddleState>(data.match.teamSize).fill(PaddleState.Unbinded);
              paddleStates[0] = PaddleState.Binded;

              const matchSettings = new MatchSettings(data.match.teamSize, paddleStates);
              const config = new OnlineMatchConfig(
                new OnlineMatchSettings(matchSettings, data.match.name,this.authService.user_info),
                mapSettings
              );
              this.logger.info('config', config);
              const manager = this.gameManager.createOnlineMatch(config, true, this, OnlineMatchState.WaitingForPlayers);
              if (!manager){
                this.logger.error('failed to start online manager');
                this.state.setValue(MatchMakingState.Standby);
                return;
              }
              this.onlineManager = manager;
              this.maxCurrentPeerConnections = 2;//info needs to be somewhere else
              this.dataChannels = new Map();
              this.peerConnections = new Map();
              this.state.setValue(MatchMakingState.OnGame);
              this.logger.info("successfully created match");
              break;
            case 'failure_already_host':
              this.logger.error('failed to create match, already in a match');
              break;
            case 'failure_already_in_another_game':
              this.logger.error('failed to create match, already in a match');
              break;
            case 'failure_duplicate_key':
              this.logger.error('match name already in use');
              this.state.setValue(MatchMakingState.Standby);
              break;
            case 'failure':
              this.logger.error('failed to create match, try again');
              this.state.setValue(MatchMakingState.Standby);
              break;
            default:
              this.logger.error(`unknown error status: ${data.status}`);
              this.state.setValue(MatchMakingState.Standby);
          }
          break;
        case 'join_match_result':
          switch (data.status){
            case 'failure_already_in_another_game':
              this.logger.error('failed to join lobby, already in another game');
              this.state.setValue(MatchMakingState.Standby);
              break;
            case 'failure':
              this.logger.error('failed to join lobby');
              this.state.setValue(MatchMakingState.Standby);
              break;
            case 'success':
              this.logger.info('match', data.match)
              const mapName = toEnum(MapsName, data.match.mapName);
              if (!mapName){
                this.logger.error('join match result switch: cant find map name')
                return;
              }
              const mapSettings = this.maps.getMapSettings(mapName);
              if (!mapSettings){
                this.logger.error('failed to create match settings?');
                this.state.setValue(MatchMakingState.Standby);
                return;
              }
              //!todo this is trash
              const paddleStates : PaddleState[] = Array<PaddleState>(data.match.teamSize).fill(PaddleState.Unbinded);
              paddleStates[1] = PaddleState.Binded;//!todo which one is us for index?

              const matchSettings = new MatchSettings(data.match.teamSize, paddleStates);
              
              const config = new OnlineMatchConfig(
                new OnlineMatchSettings(matchSettings, data.match.name,
                  new UserInfo(data.match.host.username, data.match.host.id, true)),
                this.maps.getMapSettings(MapsName.Default)!
              );//!TODO, the map is always default must be passed
              this.maxCurrentPeerConnections = data.match.max_players - 1;
              const manager = this.gameManager.createOnlineMatch(config,false, this, OnlineMatchState.Connecting);
              if (!manager){
                this.logger.error('joined match result success switch: failed to create online match');
                //!todo should tell the game that it disconnected or something
                return;
              }
              this.onlineManager = manager;
              this.state.setValue(MatchMakingState.OnGame);
              this.logger.info('successfully joined game group, waiting for webrtc');
              break;
            default:
              this.logger.error(`cant find status ${data.status}`);
              this.state.setValue(MatchMakingState.Standby);
          }
          break;
        case 'player_joined_match':
          if (!this.onlineManager){
            this.logger.error('player joined match: online manager is undefined')
            return;
          }
          if (!this.onlineManager.amIHost)
            this.onlineManager.addPlayer(new UserInfo(data.userInfo.username, data.userInfo.id, true));
          break;
        case 'player_joined_match_to_host':
          this.logger.info('player joined match to host')
          if (!(this.peerConnections instanceof Map) || !(this.dataChannels instanceof Map)){
            this.logger.error('webrtc answer switch: peerconnection or datachannels is not map');
            return;
          }
          if (this.onlineManager === undefined){
            this.logger.error('received a player joined match while not in a game');
            return
          }
          this.onlineManager.addPlayer(new UserInfo(data.userInfo.username, data.userInfo.id, true));
          const peerConnection = this.webrtcCreatePeerConnection(data.senderId)!;//we dont care because we already checked for online manager
          this.peerConnections.set(data.senderId, peerConnection);
          const dataChannel = peerConnection.createDataChannel(data.sender);
          this.webrtcSetDataChannel(dataChannel);
          this.dataChannels.set(data.senderId, dataChannel);
          peerConnection.createOffer().then(offer => {
            peerConnection.setLocalDescription(offer).then(() => {
              const message = {
                type: '/webrtc/offer',
                targetId: data.senderId,
                target: data.username,
                offer: offer,
              }
              this.sendMessage(JSON.stringify(message));
            });
          });
          break;
        case 'webrtc_offer':
          this.webrtcCreateAnswer(data.offer);
          break;
        case 'webrtc_answer':
          this.webrtcHandleAnswer(data);
          break;
        case 'webrtc_candidate':
          console.log(`candidate received from ${data.sender}`);
          this.webrtcCandidate(data);
          break;
        case 'confirm_join_match_result':
          if (this.onlineManager === undefined){
            this.logger.error('confirm join match result switch: currentMatchInfo undefined');
            return
          }
          if (!this.onlineManager.playerConnected(data.playerId)){
            this.logger.error('confirm join match result switch: playerId doesn\'t match any current player');
            return;
          }
          if (data.player === this.authService.user_info.username){
            this.setCurrentMatchState(OnlineMatchState.WaitingForPlayers);
          }
          if (this.onlineManager.amIHost ){
            this.logger.info('all players may be connected checking...', this.onlineManager.matchConfig.matchSettings)
            if (this.onlineManager.areAllPlayersConnected()){
              const message = {type : '/match/all_players_connected'};
              this.sendMessage(JSON.stringify(message));
            }
          } 
          break;
        case 'match_all_players_connected':
          setTimeout(() => {
            this.gameManager.start();
          }, 1000);
          this.router.navigate(['/play']);
          break;
        default :
          this.logger.info(`unknown case received: ${data.type}`);
        }
    }
  }

  getMatchUpdate() : MatchUpdate | undefined{
    return this.onlineManager?.getMatchUpdate();
  }

  //WEBRTC

  webrtcCreatePeerConnection(playerId: number | undefined = undefined) : RTCPeerConnection | undefined{
    if (this.onlineManager === undefined)
      return;
    const pc_config = {
      iceServers: [
        {
          urls: "stun:stun.1.google.com:19302",
        },
      ],
    };
    const peerConnection = new RTCPeerConnection(pc_config);
    peerConnection.onicecandidate = event => {
      if (event.candidate){
        if (!this.onlineManager){
          this.logger.error('on ice candidate: online manager is not set');
          return;  
        }
        this.onlineManager.subscribeOnlineMatchState((state : OnlineMatchState) => {
            this.logger.info('ice candidate: current game state', state);
            if (state === OnlineMatchState.WaitingForPlayers || state === OnlineMatchState.Connecting) {
              this.logger.info("Sending ice candidate to peer", event.candidate);
              const message = { type: '/webrtc/candidate', candidate: event.candidate };
              this.sendMessage(JSON.stringify(message));
            } 
        })
      }
    }
    peerConnection.oniceconnectionstatechange = event => {
      this.logger.info("ICE connection state: ", peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === 'connected'){
        if (!this.onlineManager){
          this.logger.error('player connected without online manager being set');
          return
        }
        if (this.onlineManager.amIHost){
          this.logger.info('am i host?', this.onlineManager.amIHost)
          if (playerId === undefined){
            this.logger.error('on iceconnection state change: while being host player id must be set')
            return;
          }
          const player = this.onlineManager.playerConnected(playerId)
          if (!player) {
            this.logger.error('on ice connection state change: player wasnt set');
            this.logger.error('sender id: ', playerId, ' current match:', this.onlineManager.getMatchSettings());
            return;
          }
          if (this.onlineManager.amIHost) {
            const message = { type: '/confirm_join/match', player: player.info.username, playerId: player.info.user_id };
            this.logger.info('confirming new player connection has been stablished');
            this.sendMessage(JSON.stringify(message));
          } 

        }
      }
    }
    peerConnection.ontrack = event => {
      this.logger.info("received remote track:", event.track);
    }
    if (playerId === undefined){
      peerConnection.ondatachannel = event => {
        this.dataChannels = event.channel;
        this.webrtcSetDataChannel(this.dataChannels);
      };
    }
    return peerConnection;
  }
  webrtcSetDataChannel(dataChannel : RTCDataChannel){
    dataChannel.onopen = () => {
      this.logger.info('Data channel opened');
    };
    dataChannel.onmessage = (event => {
      if (this.onlineManager === undefined)
        return;
      const message = JSON.parse(event.data);
      if (message.type === 'update')
        this.onlineManager.matchUpdate.update(message.data);
      else if (message.type === 'event'){
        this.logger.info('event received !!!', message)
        if (!this.onlineManager){
          this.logger.error('datachannel on message: pong event: online manager is undefinde')
          return;
        }
        if (message.method === 'broadcast')
          this.onlineManager.broadcastRemoteEvent(message.eventType, message.data);  
        else if (message.method === 'send')
          this.onlineManager.sendRemoteEvent(message.eventType, message.data);
        else
          this.logger.error('datachannel on message: event: no such method', message.method)
      }
    });
    dataChannel.onclose = () => {
      this.logger.info('Data channel closed');
    };

    // Event handler for errors
    dataChannel.onerror = (error) => {
      this.logger.error('Data channel error:', error);
    };
  }
  webrtcCandidate(data: any) {
    if (data.sender !== this.authService.user_info?.username) {
      this.logger.info('adding ice candidate')
      if (this.peerConnections instanceof Map) {
        const peerConnection = this.peerConnections.get(data.senderId);
        if (!peerConnection){
          this.logger.error('webrtc candidate: target id not recognised');
          return;
        }else{
          peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      }else if (this.peerConnections instanceof RTCPeerConnection){
        this.peerConnections.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    }
  }
  broadcastWebrtc(message : string){
    if (this.dataChannels === undefined){
      this.logger.error('broadcast webrtc: current game is undefined');
      return;
    }
    if (this.onlineManager === undefined){
      this.logger.error('broadcast webrtc: online manager not set')
      return; 
    }
    if (!this.onlineManager.amIHost){
      this.logger.error('broadcast webrtc: only host cand send a full update')
      return;
    }
    if (this.dataChannels instanceof RTCDataChannel){
      this.logger.error('broadcast webrt: data channels must be intance of map')
      return;
    }
    for (const chann of this.dataChannels.values()){
      chann.send(message);
    } 
  }

  webrtcHandleAnswer(data : any){
    if (this.onlineManager === undefined){
      this.logger.error('webrtc handle answer: online manager not set')
      return; 
    }
    if (!this.onlineManager.amIHost){
      this.logger.error('webrtc handle answer: only host can handle answer')
      return;
    }
    if (this.peerConnections === undefined || this.peerConnections instanceof RTCPeerConnection){
      this.logger.error('webrtc handle answer: peerconnections is not instance of RTCPeerConnection');
      return;
    }
    const peerConnection = this.peerConnections.get(data.targetId);
    if (!peerConnection){
      this.logger.error('webrtc handle answer: cannot find target id in map');
      return;
    }
    peerConnection.setRemoteDescription(data.answer)
      .then(() => {
        if (peerConnection.signalingState && peerConnection.localDescription && peerConnection.remoteDescription) {
          this.logger.info("remote and local description set successfully");
          this.logger.info('current game state', this.getCurrentMatchState());
        }
      })
      .catch(error => {
        this.logger.error("Error setting remote description", error);
      });
  }

  async webrtcCreateAnswer(offer: RTCSessionDescription){
    if (this.onlineManager === undefined){
      this.logger.error('webrtc create answer: online manager not set')
      return; 
    }
    if (this.onlineManager.amIHost){
      this.logger.error('webrtc create answer: only client can send answer, state is currently host');
      return;
    }
    this.peerConnections = this.webrtcCreatePeerConnection();
    if (!this.peerConnections){
      this.logger.error('webrtc create answer: peer connection not created');
      return;
    }
    await this.peerConnections.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnections.createAnswer();
    this.peerConnections.setLocalDescription(answer)
      .then(() => {
        if (this.peerConnections === undefined || this.peerConnections instanceof Map) {
          this.logger.error('webrtc create answer: peerConnetions is not instance of RTCPeerconnnection');
          return;
        }
        if (this.peerConnections.signalingState && this.peerConnections.localDescription && this.peerConnections.remoteDescription)
          this.logger.info("remote and local description set successfully");
        else
          this.logger.error("webrtc create answer: remote and local not set");
      })
      .catch(error => {
        this.logger.error("webrtc create answer: Error setting remote description", error);
      });
    const message = JSON.stringify({ type: '/webrtc/answer', answer: answer });
    this.logger.info('send message : ', { type: '/webrtc/answer', answer: answer })
    this.sendMessage(message);
  }


  //MATCH SYNC

  sendMatchUpdate(update : MatchUpdate) : void {
    if (this.dataChannels === undefined){
      this.logger.error('send match update: current game is undefined');
      return;
    }
    if (this.onlineManager === undefined){
      this.logger.error('send match update: online manager not set')
      return; 
    }
    if (!this.onlineManager.amIHost){
      this.logger.error('send match update: only host cand send a full update')
      return;
    }
    if (this.dataChannels instanceof RTCDataChannel){
      this.logger.error('send match update: data channels must be intance of map')
      return;
    }
    const message = JSON.stringify({
      type : 'update',
      data : update,
    });
    for (const chann of this.dataChannels.values()){
      chann.send(message);
    }
  }

  sendEvent(type: PongEventType, data: EventData): void {
    if (!this.onlineManager){
      this.logger.error('send event: online manager not set')
      return;
    }
    const message = {
      type : 'event',
      event : 'pongEvent',
      method : 'send',
      eventType : type,
      data : data
    };//!todo, data must be converted to sendable data. so that
      //object references are turned to ids, that will be turned
      //back to their corresponding ids in the receiver
    this.broadcastWebrtc(JSON.stringify(message));
  }
  broadcastEvent(type: PongEventType, data: EventData): void {
    if (!this.onlineManager){
      this.logger.error('send event: online manager not set')
      return;
    }
    const message = {
      type : 'event',
      method : 'broadcast',
      eventType : type,
      data : data
    };//!todo, data must be converted to sendable data. so that
      //object references are turned to ids, that will be turned
      //back to their corresponding ids in the receiver
    this.logger.info('broadcasting event to others', message)
    this.broadcastWebrtc(JSON.stringify(message));
  }
  getOnlineMatchSettings() : OnlineMatchSettings | undefined{
    return this.onlineManager?.getOnlineMatchSettings();
  }

}
