import { Injectable } from '@angular/core';
import {AuthService, UserInfo} from './auth.service';
import { Subject, Observable, BehaviorSubject } from 'rxjs';

export enum GameType {
  Tournament = 'Tournament',
  Match = 'Match',
}

export enum MatchMakingState{
  Standby,
  OnGame,
}

export enum GameState{
  Joining,
  Connecting,
  WaitingForPlayers,
  Starting,
  Running,
  FinishedSuccess,
  HostDisconected,
  GameCrash,
  FailedToJoin,
  Error,
}

class Score{
  state : GameState;
  score : [number, number];
  constructor(state : GameState, score : [number, number]){
    this.score = score;
    this.state = state;
  }
  changeState(newState : GameState){
    this.state = newState;
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

enum OnlinePlayerState{
  Joining,
  Connecting,
  Connected,
  Disconected,
  Blocked
}

class OnlinePlayer{
  private stateSubject : BehaviorSubject<OnlinePlayerState>;
  state$  : Observable<OnlinePlayerState>;
  info : UserInfo;

  constructor(info : UserInfo, state : OnlinePlayerState = OnlinePlayerState.Connecting){
    this.stateSubject = new BehaviorSubject<OnlinePlayerState>(state);
    this.state$ = this.stateSubject.asObservable();
    this.info = info;
  }
  state(): OnlinePlayerState{
    return this.stateSubject.value;
  }
  changeState(state : OnlinePlayerState){
    this.stateSubject.next(state);
  }
}

export class Match{
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

export class Tournament{
  host : UserInfo;
  players : UserInfo[] = [];
  scores : [number,number][] = [];
  winners : number[] = [];
  teamSize : number;
  name : string;
  
  constructor (name : string, teamSize : number, host : UserInfo){
    this.name = name;
    this.teamSize = teamSize;
    this.host = host;
  }

  addPlayer(newPlayer : UserInfo) : boolean{
    if (this.players.length === 8 * this.teamSize){
      return false;
    }
    this.players.push(newPlayer);
    return true;
  }

  removePlayer(username : string) : boolean{
    const index_to_remove = this.players.findIndex((player) => player.username === username);
    if (index_to_remove === -1)
      return false;
    this.players.splice(index_to_remove, 1);
    return true
  }

}

export enum Maps{
  Default = 'Default',
  Fancy = 'Fancy'
}

export class GameSettings{
  gameType : GameType;
  name : string;
  tags : string;
  teamSize : number = 1;
  winScore : number = 3;
  map : Maps = Maps.Default;
  publicGame : boolean;
  constructor (gameType : GameType, name : string, tags : string, publicGame: boolean){
    this.gameType = gameType;
    this.name = name;
    this.tags = tags;
    this.publicGame= publicGame;
  }
}

export enum MatchmakingUptate{
  Match,
  Tournament
}

@Injectable({
  providedIn: 'root'
})
export class MatchmakingService {
  webSocketUrl = 'wss://localhost:1501/ws/matchmaking/global/';
  webSocket : WebSocket | undefined;

  amIHost : boolean = false;
  maxCurrentPeerConnections : number = 0; 
  peerConnections : (Map<number,RTCPeerConnection> | RTCPeerConnection | undefined);
  dataChannels : (Map<number,RTCDataChannel> | RTCDataChannel | undefined);
  
  private dataChangedSubject: Subject<void> = new Subject<void>();
  dataChanged$: Observable<void> = this.dataChangedSubject.asObservable();

  entries : Map<GameType, GameSettings[]> = new Map<GameType, GameSettings[]>;

  state : MatchMakingState = MatchMakingState.Standby;
  currentGame : Match | undefined;
  private currentGameStateSubject : BehaviorSubject<GameState | undefined>;
  currentGameState$  : Observable<GameState | undefined>;

  constructor(private authService : AuthService) {
    this.entries.set(GameType.Match, []);
    this.entries.set(GameType.Tournament,[]);
    this.currentGameStateSubject = new BehaviorSubject<GameState | undefined>(undefined);
    this.currentGameState$ = this.currentGameStateSubject.asObservable();
    this.connectToServer();
    if(this.isConnected()){
      this.sendMessage(JSON.stringify({type : '/getStatus'}));
    }
  }
  
  webrtcCreatePeerConnection(playerId: number | undefined = undefined) : RTCPeerConnection{
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
        this.currentGameState$?.subscribe(state => {
          console.log('ice candidate: current game state', state);
          if (state === GameState.Connecting){
            console.log("Sending ice candidate to peer", event.candidate);
            const message = {type : '/webrtc/candidate', candidate : event.candidate};
            this.sendMessage(JSON.stringify(message));
          }
        });
      }
    }
    peerConnection.oniceconnectionstatechange = event => {
      console.log("ICE connection state: ", peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === 'connected'){
        this.state = MatchMakingState.OnGame;
        if (this.amIHost){
          if (playerId === undefined){
            console.error('on ice connection state change: targetId not set while being host');
            return;
          }
        
          const player = this.currentGame?.players.filter(player => player.info.user_id === playerId)[0];
          if (player === undefined){
            console.error('on ice connection state change: player wasnt set');
            console.error('sender id: ', playerId ,' current match:', this.currentGame);
            return;
          }
          const message = {type : '/confirm_join/match', player : player.info.username, playerId : player.info.user_id};
          console.log('confirming new player connection has been stablished');
          this.sendMessage(JSON.stringify(message));
        }
      }
    }
    peerConnection.ontrack = event => {
      console.log("received remote track:", event.track);
    }
    return peerConnection;
  }
  currentGameState() : GameState | undefined{
    return this.currentGameStateSubject?.value;
  }
  setCurrentGameState(state : GameState){
    if (this.currentGameStateSubject === undefined)
      console.error('current game state is not initialized');
    else
      this.currentGameStateSubject.next(state);
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
              this.state = MatchMakingState.Standby;
              break;
            case 'JoiningGame':
              this.state = MatchMakingState.OnGame;
              break;
            case 'InGame':
              this.state = MatchMakingState.OnGame
              break;
            default:
              console.error(`unknown status : ${data.status}`);
            }
          break;
        case 'new_match':
          this.entries.get(GameType.Match)
            ?.push(new GameSettings(GameType.Match, data.match.name, data.match.tags, true));
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
              this.state = MatchMakingState.OnGame;
              this.currentGame = new Match(data.match.name, 1, this.authService.user_info);//info needs to be somewhere else
              this.setCurrentGameState(GameState.WaitingForPlayers)
              this.maxCurrentPeerConnections = 2;//info needs to be somewhere else
              this.dataChannels = new Map();
              this.peerConnections = new Map();
              this.amIHost = true;
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
              this.state = MatchMakingState.Standby;
              break;
            case 'failure':
              console.error('failed to create match, try again');
              this.state = MatchMakingState.Standby;
              break;
            default:
              console.error(`unknown error status: ${data.status}`);
              this.state = MatchMakingState.Standby;
          }
          break;
        case 'join_match_result':
          switch (data.status){
            case 'failure_already_in_another_game':
              console.error('failed to join lobby, already in another game');
              this.state = MatchMakingState.Standby;
              break;
            case 'failure':
              console.error('failed to join lobby');
              this.state = MatchMakingState.Standby;
              break;
            case 'success':
              console.log('match info,', data.match);
              this.state = MatchMakingState.OnGame;
              this.currentGame = new Match(data.match.name, data.match.max_players / 2, new UserInfo(data.match.host.username, data.match.host.id, true));
              this.setCurrentGameState(GameState.Connecting);
              this.maxCurrentPeerConnections = data.match.max_players - 1;
              console.log('successfully joined game group, waiting for webrtc');
              this.amIHost = false;
              break;
            default:
              console.error(`cant find status ${data.status}`);
              this.state = MatchMakingState.Standby;
          }
          break;
        case 'player_joined_match':
          if (this.amIHost)
            return;
          if (this.currentGame !== undefined) {
            this.currentGame.addPlayer(new UserInfo(data.userInfo.username, data.userInfo.id, true), OnlinePlayerState.Connecting);
            console.log('player joined match !!!!!!!!!!!!!');
            //if (this.u this.authService.user_info.username === this.currentGame?.host.username)
                return;
            //}
            
          }else{
            console.error('received a player joined match while not in a game');
            return 
          }
          console.log(`player ${data.username} joined the match`);
          break;
        case 'player_joined_match_to_host':
          console.log('player joined match to host')
          if (this.peerConnections instanceof Map && this.dataChannels instanceof Map){
            if (this.currentGame !== undefined) {
              this.currentGame.addPlayer(new UserInfo(data.userInfo.username, data.userInfo.id, true), OnlinePlayerState.Connecting);
              console.log('player joined match !!!!!!!!!!!!!');
            }else{
              console.error('received a player joined match while not in a game');
              return 
            }
            const peerConnection = this.webrtcCreatePeerConnection(data.senderId); 
            this.peerConnections.set(data.senderId,peerConnection);
            this.dataChannels.set(data.senderId,peerConnection.createDataChannel('dataChann'));
          }
          else{
            console.error('webrtc answer switch: peerconnection or datachannels is not map');
            return;
          }
          this.webrtcCreateAnswer(data.sdp, data.username, data.senderId);
          break;
        case 'webrtc_answer':
          //console.error('!todo');
          if (!this.amIHost)
            this.webrtcHandleAnswer(data);
          break;
        case 'webrtc_candidate':
          console.log(`candidate received from ${data.sender}`);
          this.webrtcCandidate(data);
/*          if (data.sender != this.authService.user_info.username)
            this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
*/      
          break;
        case 'confirm_join_match_result':
          if (this.currentGame === undefined){
            console.error('confirm join match result switch: currentGame undefined');
            return
          }
          const player = this.currentGame.getPlayer(data.playerId);
          if (player === undefined) {
            console.error('confirm join match result switch: playerId doesn\'t match any current player');
            console.error('current game data, ', this.currentGame);
            return;
          }
          player.changeState(OnlinePlayerState.Connected);
          if (data.player === this.authService.user_info.username){
            this.setCurrentGameState(GameState.WaitingForPlayers);
          }
          if (this.amIHost){
            if (this.currentGame.players.length + 1 === this.currentGame.teamSize * 2
              && this.currentGame.players.every(player => player.state() === OnlinePlayerState.Connected)){
                const message = {type : '/match/all_players_connected'};
              this.sendMessage(JSON.stringify(message));
            }
          } 
          break;
        case 'match_all_players_connected':
          setTimeout(() => this.setCurrentGameState(GameState.Starting), 3000);
          break;
        default :
          console.log(`unknown case received: ${data.type}`);
        }
    }
  }

  webrtcHandleAnswer(data : any){
    if (this.amIHost){
      console.error('webrtc handle answer: only clients can handle answers, not hosts');
      return;
    }
    if (!(this.peerConnections instanceof RTCPeerConnection)){
      console.error('webrtc handle answer: peerconnections is not instance of RTCPeerConnection');
      return;
    }
    this.peerConnections.setRemoteDescription(new RTCSessionDescription(data.answer))
      .then(() => {
        if (this.peerConnections instanceof RTCPeerConnection){
          if (this.peerConnections.signalingState && this.peerConnections.localDescription && this.peerConnections.remoteDescription){
            console.log("remote and local description set successfully");
            console.log('current game state', this.currentGameStateSubject?.value);
          }
        }else{
          console.error("webrtc handle answer: peerconnection is not RTCPeerConnection instance");
        }
      })
      .catch(error => {
        console.error("Error setting remote description", error);
      });
  }
  async webrtcCreateAnswer(offer: RTCSessionDescription, sender :string, senderId : number){
    if (!this.amIHost){
      console.error('webrtc create answer: only host can create answer, state is not currently host');
      return;
    }
    if (!(this.peerConnections instanceof Map)){
      console.error('webrtc create answer: state is host jet peerconnections is not instance of map');
      return;
    }
    const peerConnection = this.peerConnections.get(senderId);
    if (!peerConnection){
      console.error('webrtc create answer: target id not recognised');
      return;
    }
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    //await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    peerConnection.setLocalDescription(answer)
      .then(() => {
        if (peerConnection.signalingState && peerConnection.localDescription && peerConnection.remoteDescription)
            console.log("remote and local description set successfully");
        else
          console.error("webrtc create answer: remote and local not set");
      })
      .catch(error => {
        console.error("webrtc create answer: Error setting remote description", error);
      });
    const message = JSON.stringify({type : '/webrtc/answer', answer : answer, target : sender});
    console.log('send message : ', {type : '/webrtc/answer', answer : answer, target : sender})
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
      if (this.amIHost){
        console.error('join match: already match host');
        return;
      }
      this.peerConnections = this.webrtcCreatePeerConnection();
      this.dataChannels = this.peerConnections.createDataChannel('dataChann');
      const offer = await this.peerConnections.createOffer();
      console.log('local description set')
      await this.peerConnections.setLocalDescription(offer);
      //const sdp = await this.createOffer(this.peerConnections);
      if (offer !== undefined && offer !== null) {
          let messageObject = {
            type: '/join/match',
            name: matchName,
            sdp: offer 
          }
        this.sendMessage(JSON.stringify(messageObject))
        this.amIHost = false;
      }else{
        console.error('join match: failed to create offer');
        this.peerConnections.close();
        return;
      }
    }else
      console.error('join match: failled to join match called');
  }
  async joinTournament(tournamentName : string){
    if (this.isConnected()){
      this.peerConnections = this.webrtcCreatePeerConnection();
      const offer = await this.peerConnections.createOffer();
      console.log('local description set')
      await this.peerConnections.setLocalDescription(offer);
//      const offer = await this.createOffer(this.peerConnections);
      if (offer !== undefined && offer !== null) {
        let messageObject = {
          type: '/tournament/join',
          name: tournamentName,
          sdp: offer 
        }
        this.sendMessage(JSON.stringify(messageObject));
      }
    }
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
}
