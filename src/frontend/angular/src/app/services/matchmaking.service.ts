import { Injectable } from '@angular/core';
import {AuthService, UserInfo} from './auth.service';
import { Subject, Observable, lastValueFrom } from 'rxjs';

export enum GameType {
  Tournament = 'Tournament',
  Match = 'Match',
}

export enum MatchMakingState{
  Standby,
  OnGame,
}

export enum GameState{ 
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

export class Match{
  host : UserInfo;
  players : UserInfo[] = [];
  score : [number,number] = [0,0];
  teamSize : number;
  name : string;
  
  constructor (name : string, teamSize : number, host : UserInfo){
    this.name = name;
    this.teamSize = teamSize;
    this.host = host;
  }
  addPlayer(newPlayer : UserInfo) : boolean{
    if (this.players.length == 2 * this.teamSize){
      return false;
    }
    this.players.push(newPlayer);
    return true;
  }

  removePlayer(username : string) : boolean{
    const index_to_remove = this.players.findIndex((player) => player.username == username);
    if (index_to_remove === -1)
      return false;
    this.players.splice(index_to_remove, 1);
    return true
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
    if (this.players.length == 8 * this.teamSize){
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
  webSocketUrl = 'wss://localhost/ws/matchmaking/global/';
  webSocket : WebSocket | undefined;
  peerConnection : RTCPeerConnection;
  dataChannel : RTCDataChannel;
  
  private dataChangedSubject: Subject<void> = new Subject<void>();
  dataChanged$: Observable<void> = this.dataChangedSubject.asObservable();

  entries : Map<GameType, GameSettings[]> = new Map<GameType, GameSettings[]>;

  state : MatchMakingState = MatchMakingState.Standby;
  gameState : GameState | undefined;
  currentGame : Tournament | Match | undefined;

  constructor(private authService : AuthService) {
    this.entries.set(GameType.Match, []);
    this.entries.set(GameType.Tournament,[]);
    this.connectToServer();
    if(this.isConnected()){
      this.sendMessage(JSON.stringify({type : '/getStatus'}));
    }
    const pc_config = {
      iceServers: [
        {
          urls: "stun:stun.1.google.com:19302",
        },
       /* {
          urls : "turn:127.0.0.1:3478", 
          username: "a",
          credential: "a",
        }*/
      ],
    };
    this.peerConnection = new RTCPeerConnection(pc_config);
    this.dataChannel = this.peerConnection.createDataChannel('dataChann');
    this.dataChannel.onmessage = event => {
      console.log("message received:",event.data);
    }
    this.peerConnection.onicecandidate = event => {
      if (event.candidate){
        console.log("Sending ice candidate to peer", event.candidate);
        const message = {type : '/webrtc/candidate', candidate : event.candidate};
        this.sendMessage(JSON.stringify(message));
      }
    }
    this.peerConnection.oniceconnectionstatechange = event => {
      console.log("ICE connection state: ", this.peerConnection.iceConnectionState);
      if (this.peerConnection.iceConnectionState === 'connected'){
        this.state = MatchMakingState.OnGame;
        this.gameState = GameState.WaitingForPlayers;
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
          this.entries.set(GameType.Tournament, data.tournaments);
          break;
        case 'new_match_result':
          switch (data.status){
            case 'success':
              this.state = MatchMakingState.OnGame;
              this.gameState = GameState.WaitingForPlayers;
              this.currentGame = new Match(data.match.name, 1, this.authService.user_info);
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
              this.state = MatchMakingState.OnGame;
              this.gameState = GameState.Connecting;
              this.currentGame = new Match(data.match.name, data.match.teamSize, data.match.users);
              console.log('successfully joined game group, waiting for webrtc');
              break;
            default:
              console.error(`cant find status ${data.status}`);
              this.state = MatchMakingState.Standby;
          }
          break;
        case 'player_joined_match':
          if (this.currentGame !== undefined) {
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
          this.createAnswer(data.sdp, data.username);
          break;
        case 'webrtc_answer':
          this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
            .then(() => {
              console.log("remote description set successfully");
            })
            .catch(error => {
              console.error("Error setting remote description", error);
            });
          break;
        case 'webrtc_candidate':
          if (data.sender != this.authService.user_info.username)
            this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
          break;
        default :
          console.log(`unknown case received: ${data.type}`);
        }
    }
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
      const sdp = await this.createOffer();
      if (sdp !== undefined && sdp !== null) {
          let messageObject = {
            type: '/join/match',
            name: matchName,
            sdp: sdp 
          }
        this.sendMessage(JSON.stringify(messageObject));
      }
    }else
      console.error('failled to join match called');
  }
  async joinTournament(tournamentName : string){
    if (this.isConnected()){
      const offer = await this.createOffer();
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


  async createOffer() : Promise<RTCSessionDescriptionInit>{
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }
  async createAnswer(offer: RTCSessionDescription, target : string){
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    const message = JSON.stringify({type : '/webrtc/answer', answer : answer, target : target});
    this.sendMessage(message);
  }
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
