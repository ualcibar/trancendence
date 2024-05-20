import { Injectable } from '@angular/core';
import {AuthService, UserInfo} from './auth.service';
import { Subject, Observable} from 'rxjs';
import { Router } from '@angular/router';
import { State } from '../utils/state';

import { Ball, Block, Paddle} from '../pages/pong/pong.component';
import { GameManagerService,  MatchConfig, OnlineMatchManager } from './game-config.service';
import { MapsName, MapsService } from './map.service';
export enum GameType {
  Tournament = 'Tournament',
  Match = 'Match',
}

export enum MatchMakingState{
  Standby,
  OnGame,
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
}

/*
export class MatchGame{
  state : State<OnlineMatchState>;
  score : Score;
  update : MatchUpdate;
  constructor (state : OnlineMatchState, score : Score, update : MatchUpdate | undefined, id : number, config : MatchInfo){
    this.state = new State(state);
    this.score = score;
    if (update)
      this.update = update;
    else{
      this.update = new MatchUpdate(undefined,undefined,undefined,undefined,undefined, [],undefined,config);
    }
  } 
}*/

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

export class MatchInfo{
  host : UserInfo;
  players : OnlinePlayer[] = [];
  score : [number,number] = [0,0];
  teamSize : number;
  name : string;
  
  constructor (name : string, teamSize : number, host : UserInfo){
    this.name = name;
    this.teamSize = teamSize;
    this.host = host;
  }
  addPlayer(newPlayer : UserInfo, state : OnlinePlayerState) : boolean{
    if (this.players.length == 2 * this.teamSize){
      return false;
    }
    this.players.push(new OnlinePlayer(newPlayer, state));
    return true;
  }

  removePlayer(username : string) : boolean{
    const index_to_remove = this.players.findIndex((player) => player.info.username == username);
    if (index_to_remove === -1)
      return false;
    this.players.splice(index_to_remove, 1);
    return true
  }

  getPlayer(playerId : number) : OnlinePlayer | undefined{
    return this.players.filter(player => player.info.user_id === playerId)[0];
  }
}

export class GameSettings{
  gameType : GameType;
  name : string;
  tags : string;
  teamSize : number;
  winScore : number = 3;
  map : MapsName = MapsName.Default;
  publicGame : boolean;
  constructor( gameType : GameType, name : string, tags : string,
               publicGame: boolean, teamSize : number){
    this.gameType = gameType;
    this.name = name;
    this.tags = tags;
    this.publicGame= publicGame;
    this.teamSize = teamSize;
  }
}


@Injectable({
  providedIn: 'root'
})
export class MatchmakingService {
  //backend connection
  webSocketUrl = 'wss://localhost:1501/ws/matchmaking/global/';
  webSocket! : WebSocket;

  //state of the service
  state : State<MatchMakingState> = new State<MatchMakingState>(MatchMakingState.Standby);
  
  //current match info
  //this should be managed by the gameManager onlineMatch
/*
  currentMatchInfo : MatchInfo | undefined;
  currentMatch : MatchGame | undefined;
  amIHost : boolean = false;
*/
//the connection though could stay here
  maxCurrentPeerConnections : number = 0; 
  peerConnections : (Map<number,RTCPeerConnection> | RTCPeerConnection | undefined);
  dataChannels : (Map<number,RTCDataChannel> | RTCDataChannel | undefined);
 
  //info about the current matches available
  entries : Map<GameType, GameSettings[]> = new Map<GameType, GameSettings[]>;
  private dataChangedSubject: Subject<void> = new Subject<void>();
  dataChanged$: Observable<void> = this.dataChangedSubject.asObservable();

  //private currentMatchInfoStateSubject : BehaviorSubject<OnlineMatchState | undefined>;
  //currentMatchInfoState$  : Observable<OnlineMatchState | undefined>;
  private onlineManager? : OnlineMatchManager | undefined;

  constructor(private authService : AuthService,private router : Router, private maps : MapsService, private gameManager : GameManagerService){
    this.entries.set(GameType.Match, []);
    this.entries.set(GameType.Tournament,[]);
    //this.currentMatchInfoStateSubject = new BehaviorSubject<OnlineMatchState | undefined>(undefined);
    //this.currentMatchInfoState$ = this.currentMatchInfoStateSubject.asObservable();
    this.connectToServer();
    if(this.isConnected()){
      this.sendMessage(JSON.stringify({type : '/getStatus'}));
    }
  }
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
          console.error('on ice candidate: online manager is not set');
          return;  
        }
        this.onlineManager.subscribeOnlineMatchState((state : OnlineMatchState) => {
            console.log('ice candidate: current game state', state);
            if (state === OnlineMatchState.WaitingForPlayers || state === OnlineMatchState.Connecting) {
              console.log("Sending ice candidate to peer", event.candidate);
              const message = { type: '/webrtc/candidate', candidate: event.candidate };
              this.sendMessage(JSON.stringify(message));
            } 
        })
        /*refactored
        if (this.currentMatch === undefined){
          console.error('current match must be set');
        }else{
          this.currentMatch.state.observable.subscribe(state => {
            console.log('ice candidate: current game state', state);
            if (state === OnlineMatchState.WaitingForPlayers || state === OnlineMatchState.Connecting) {
              console.log("Sending ice candidate to peer", event.candidate);
              const message = { type: '/webrtc/candidate', candidate: event.candidate };
              this.sendMessage(JSON.stringify(message));
            }
          });
          
        }*/
      }
    }
    peerConnection.oniceconnectionstatechange = event => {
      console.log("ICE connection state: ", peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === 'connected'){
        //this.state.setValue(MatchMakingState.OnGame); refactor
        if (!this.onlineManager){
          console.error('player connected without online manager being set');
          return
        }
        const player = this.onlineManager.playerConnected(playerId)
        if (!player) {
          console.error('on ice connection state change: player wasnt set');
          console.error('sender id: ', playerId, ' current match:', this.onlineManager.getConfig().info);
          return;
        }
        if (this.onlineManager.amIHost){
          const message = { type: '/confirm_join/match', player: player.info.username, playerId: player.info.user_id };
          console.log('confirming new player connection has been stablished');
          this.sendMessage(JSON.stringify(message));
        } 
        /*refactored
        if (this.amIHost){
          if (playerId === undefined){
            console.error('on ice connection state change: targetId not set while being host');
            return;
          }
        
          const player = this.currentMatchInfo?.players.filter(player => player.info.user_id === playerId)[0];
          if (player === undefined){
            console.error('on ice connection state change: player wasnt set');
            console.error('sender id: ', playerId ,' current match:', this.currentMatchInfo);
            return;
          }
          const message = {type : '/confirm_join/match', player : player.info.username, playerId : player.info.user_id};
          console.log('confirming new player connection has been stablished');
          this.sendMessage(JSON.stringify(message));
        }
        */
      }
    }
    peerConnection.ontrack = event => {
      console.log("received remote track:", event.track);
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
    //const dataChannel = peerConnection.createDataChannel('a');
    dataChannel.onopen = () => {
      console.log('Data channel opened');
    };
    dataChannel.onmessage = (event => {/* TEMP COMMENT
      if (this.currentMatch === undefined)
        return;
      const message = JSON.parse(event.data);
      if (message.type === 'update')
        //console.log('update', message.data)
        this.currentMatch.update = message.data; 
      //console.log('DATACHANNEL message: ',event.data);*/
    });
    dataChannel.onclose = () => {
      console.log('Data channel closed');
    };

    // Event handler for errors
    dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
    };
  }
  getCurrentMatchState() : OnlineMatchState | undefined{
    return this.onlineManager?.getOnlineState();
    /*if (this.currentMatch === undefined)
      console.error('current game state is not initialized');
    return this.currentMatch?.state.getCurrentValue();*/
  }
  setCurrentMatchState(state : OnlineMatchState){
    if (this.onlineManager?.setOnlineMatchState(state) === undefined)
      console.error('current game state is not initialized');
  }

  webrtcCandidate(data: any) {
    if (data.sender !== this.authService.user_info?.username) {
      console.log('adding ice candidate')
      if (this.peerConnections instanceof Map) {
        const peerConnection = this.peerConnections.get(data.senderId);
        if (!peerConnection){
          console.error('webrtc candidate: target id not recognised');
          return;
        }else{
          peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      }else if (this.peerConnections instanceof RTCPeerConnection){
        this.peerConnections.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    }
  }
  connectToServer() {
    const jwtToken = this.authService.getCookie('access_token');
    if (jwtToken == null) {
      console.log('failed to get cookie access token, log in');
    }
    this.webSocketUrl = `${this.webSocketUrl}?token=${jwtToken}`;
    this.webSocket = new WebSocket(this.webSocketUrl);
    this.webSocket.onopen = () => {
      console.log('WebSocket connection opened');
    };
    this.webSocket.onerror = () => {
    }
    this.webSocket.onclose = () => {
    };
    this.webSocket.onmessage = (event) => {
      if (this.authService.user_info === undefined)
        return;
      const data = JSON.parse(event.data);
      console.log('message of type ', data.type, ' received.')
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
              console.error(`unknown status : ${data.status}`);
            }
          break;
        case 'new_match':
          this.entries.get(GameType.Match)
            ?.push(new GameSettings(GameType.Match, data.match.name, data.match.tags, true, 1));//!todo team size
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
          console.log('match list received', data.matches);
          this.entries.set(GameType.Tournament, data.tournaments);
          break;
        case 'new_match_result':
          switch (data.status){
            case 'success':
              const config = new MatchConfig(
                new MatchInfo(data.match.name, data.match.teamSize, this.authService.user_info),
                this.maps.getMapSettings(MapsName.Default)!
              );
              this.gameManager.startOnlineMatch(config, true);
              //this.currentMatchInfo = new MatchInfo(data.match.name, 1, this.authService.user_info);//info needs to be somewhere else
              //this.currentMatch = new MatchGame(OnlineMatchState.WaitingForPlayers, new Score([0,0]), undefined, 0,this.currentMatchInfo);
              this.maxCurrentPeerConnections = 2;//info needs to be somewhere else
              this.dataChannels = new Map();
              this.peerConnections = new Map();
              //this.amIHost = true;
              this.state.setValue(MatchMakingState.OnGame);
              console.log("successfully created match");
              break;
            case 'failure_already_host':
              console.error('failed to create match, already in a match');
              break;
            case 'failure_already_in_another_game':
              console.error('failed to create match, already in a match');
              break;
            case 'failure_duplicate_key':
              console.error('match name already in use');
              this.state.setValue(MatchMakingState.Standby);
              break;
            case 'failure':
              console.error('failed to create match, try again');
              this.state.setValue(MatchMakingState.Standby);
              break;
            default:
              console.error(`unknown error status: ${data.status}`);
              this.state.setValue(MatchMakingState.Standby);
          }
          break;
        case 'join_match_result':
          switch (data.status){
            case 'failure_already_in_another_game':
              console.error('failed to join lobby, already in another game');
              this.state.setValue(MatchMakingState.Standby);
              break;
            case 'failure':
              console.error('failed to join lobby');
              this.state.setValue(MatchMakingState.Standby);
              break;
            case 'success':
              console.log('match info,', data.match);
              this.state .setValue(MatchMakingState.OnGame);
              const config = new MatchConfig(
                new MatchInfo(data.match.name, data.match.max_players / 2, new UserInfo(data.match.host.username, data.match.host.id, true)),
                this.maps.getMapSettings(MapsName.Default)!
              );//!TODO, the map is always default must be passed
              //this.setCurrentMatchState(OnlineMatchState.Connecting);
              //this.currentMatch = new MatchGame(OnlineMatchState.WaitingForPlayers, new Score([0,0]), undefined,0, this.currentMatchInfo);
              this.maxCurrentPeerConnections = data.match.max_players - 1;
              this.gameManager.startOnlineMatch(config,false);
              console.log('successfully joined game group, waiting for webrtc');
              break;
            default:
              console.error(`cant find status ${data.status}`);
              this.state.setValue(MatchMakingState.Standby);
          }
          break;
        case 'player_joined_match':
          this.onlineManager?.addPlayer(new UserInfo(data.userInfo.username, data.userInfo.id, true));
          break;
        case 'player_joined_match_to_host':
          console.log('player joined match to host')
          if (!(this.peerConnections instanceof Map) || !(this.dataChannels instanceof Map)){
            console.error('webrtc answer switch: peerconnection or datachannels is not map');
            return;
          }
          if (this.onlineManager?.addPlayer(new UserInfo(data.userInfo.username, data.userInfo.id, true)) === undefined){
            console.error('received a player joined match while not in a game');
            return
          }
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
          //this.webrtcCreateAnswer(data.sdp, data.username, data.senderId);
          break;
        case 'webrtc_offer':
          this.webrtcCreateAnswer(data.offer);
          break;
        case 'webrtc_answer':
          //console.error('!todo');
          this.webrtcHandleAnswer(data);
          break;
        case 'webrtc_candidate':
          console.log(`candidate received from ${data.sender}`);
          this.webrtcCandidate(data);
          break;
        case 'confirm_join_match_result':
          if (this.onlineManager === undefined){
            console.error('confirm join match result switch: currentMatchInfo undefined');
            return
          }
          if (!this.onlineManager.playerConnected(data.playerId)){
            console.error('confirm join match result switch: playerId doesn\'t match any current player');
            return;
          }
          if (data.player === this.authService.user_info.username){
            this.setCurrentMatchState(OnlineMatchState.WaitingForPlayers);
          }
          if (this.onlineManager.amIHost && this.onlineManager.areAllPlayersConnected()){
            const message = {type : '/match/all_players_connected'};
            this.sendMessage(JSON.stringify(message));
          } 
          break;
        case 'match_all_players_connected':
          setTimeout(() => {
            this.setCurrentMatchState(OnlineMatchState.Starting);
            setTimeout(()=> this.router.navigate(['/play']), 100);
          }, 3000);
          break;
        default :
          console.log(`unknown case received: ${data.type}`);
        }
    }
  }

  getMatchUpdate() : MatchUpdate | undefined{
    return this.onlineManager?.getMatchUpdate();
  }

  sendMatchUpdate(update : MatchUpdate) {
    if (this.dataChannels === undefined){
      console.error('send match update: current game is undefined');
      return;
    }
    if (this.onlineManager === undefined){
      console.error('send match update: online manager not set')
      return; 
    }
    if (!this.onlineManager.amIHost){
      console.error('send match update: only host cand send a full update')
      return;
    }
    if (this.dataChannels instanceof RTCDataChannel){
      console.error('send match update: data channels must be intance of map')
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

  broadcastWebrtc(message : string){
    if (this.dataChannels === undefined){
      console.error('broadcast webrtc: current game is undefined');
      return;
    }
    if (this.onlineManager === undefined){
      console.error('broadcast webrtc: online manager not set')
      return; 
    }
    if (!this.onlineManager.amIHost){
      console.error('broadcast webrtc: only host cand send a full update')
      return;
    }
    if (this.dataChannels instanceof RTCDataChannel){
      console.error('broadcast webrt: data channels must be intance of map')
      return;
    }
    for (const chann of this.dataChannels.values()){
      chann.send(message);
    } 
  }

  webrtcHandleAnswer(data : any){
    if (this.onlineManager === undefined){
      console.error('webrtc handle answer: online manager not set')
      return; 
    }
    if (!this.onlineManager.amIHost){
      console.error('webrtc handle answer: only host cand send a full update')
      return;
    }
    if (this.peerConnections === undefined || this.peerConnections instanceof RTCPeerConnection){
      console.error('webrtc handle answer: peerconnections is not instance of RTCPeerConnection');
      return;
    }
    const peerConnection = this.peerConnections.get(data.targetId);
    if (!peerConnection){
      console.error('webrtc handle answer: cannot find target id in map');
      return;
    }
    peerConnection.setRemoteDescription(data.answer)
      .then(() => {
        if (peerConnection.signalingState && peerConnection.localDescription && peerConnection.remoteDescription) {
          console.log("remote and local description set successfully");
          console.log('current game state', this.getCurrentMatchState());
        }
      })
      .catch(error => {
        console.error("Error setting remote description", error);
      });
  }
  async webrtcCreateAnswer(offer: RTCSessionDescription){
    if (this.onlineManager === undefined){
      console.error('webrtc create answer: online manager not set')
      return; 
    }
    if (this.onlineManager.amIHost){
      console.error('webrtc create answer: only client can send answer, state is currently host');
      return;
    }
    /*if (this.peerConnections === undefined || this.peerConnections instanceof Map){
      console.error('webrtc create answer: peerConnetions is not instance of RTCPeerconnnection');
      return;
    }*/
    /*const peerConnection = this.peerConnections.get(senderId);
    */
    this.peerConnections = this.webrtcCreatePeerConnection();
    if (!this.peerConnections){
      console.error('webrtc create answer: peer connection not created');
      return;
    }
    await this.peerConnections.setRemoteDescription(new RTCSessionDescription(offer));
    //await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnections.createAnswer();
    this.peerConnections.setLocalDescription(answer)
      .then(() => {
        if (this.peerConnections === undefined || this.peerConnections instanceof Map) {
          console.error('webrtc create answer: peerConnetions is not instance of RTCPeerconnnection');
          return;
        }
        if (this.peerConnections.signalingState && this.peerConnections.localDescription && this.peerConnections.remoteDescription)
            console.log("remote and local description set successfully");
        else
          console.error("webrtc create answer: remote and local not set");
      })
      .catch(error => {
        console.error("webrtc create answer: Error setting remote description", error);
      });
    const message = JSON.stringify({ type: '/webrtc/answer', answer: answer });
    console.log('send message : ', { type: '/webrtc/answer', answer: answer })
    this.sendMessage(message);
  }

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
      if (gameSettings.gameType === GameType.Tournament){
        messageObject = { type: '/new_tournament', settings : gameSettings} ;
      } else if (gameSettings.gameType === GameType.Match){
        messageObject = { type: '/new_match', settings : gameSettings };
      }else
        return;
      this.sendMessage(JSON.stringify(messageObject));
      console.log('new game called');
    }
  }
  reloadMatchesTournamets(){
    if (this.isConnected()){
      let messageObject = {type : '/match_tournament_list'};
      this.sendMessage(JSON.stringify(messageObject));
    }
  }

  async joinMatch(matchName : string){
    console.log('join match called');
    if (this.isConnected()){
      if (this.onlineManager){
        console.error('join match: already in match');
        return;
      }
      /*this.peerConnections = this.webrtcCreatePeerConnection();
      this.dataChannels = this.peerConnections.createDataChannel('dataChann');
      const offer = await this.peerConnections.createOffer();
      console.log('local description set')
      await this.peerConnections.setLocalDescription(offer);
              //const sdp = await this.createOffer(this.peerConnections);
      if (offer !== undefined && offer !== null) {*/
      let messageObject = {
        type: '/join/match',
        name: matchName,
      }
      this.sendMessage(JSON.stringify(messageObject))
    }else
      console.error('join match: failled to join match called');
  }
  /*async createOffer() : Promise<RTCSessionDescriptionInit | undefined>{
    return offer;
  }*/

  sendMessage(message : string): boolean {
    if (this.isConnected()) {
      //const jsonMessage = JSON.stringify(message); // Convert the object to JSON string
      this.webSocket?.send(message); // Send the JSON string over the WebSocket connection
      return true;
    } else {
      console.error('WebSocket connection is not open');
      return false;
    }
  }

  getMatchInfo() : MatchInfo | undefined{
    return this.onlineManager?.getConfig().info;
  }
}
