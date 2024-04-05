import { Injectable } from '@angular/core';
import {AuthService, UserInfo} from './auth.service';
import { Subject, Observable, interval } from 'rxjs';

export enum GameType {
  Tournament = 'Tournament',
  Match = 'Match',
}

enum MatchMakingState{
  Standby,
  Connecting,
  OnGame,
}

enum GameState{ 
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
  players : UserInfo[] = [];
  score : [number,number] = [0,0];
  teamSize : number;
  name : string;
  
  constructor (name : string, teamSize : number){
    this.name = name;
    this.teamSize = teamSize;
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
  players : UserInfo[] = [];
  scores : [number,number][] = [];
  winners : number[] = [];
  teamSize : number;
  name : string;
  
  constructor (name : string, teamSize : number){
    this.name = name;
    this.teamSize = teamSize;
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

export class GameSettings{
  gameType : GameType;
  name : string;
  tags : string;
  publicGame : boolean;
  constructor (gameType : GameType, name : string, tags : string, publicGame: boolean){
    this.gameType =gameType;
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
  webSocketUrl = 'wss://localhost/ws/matchmaking/';
  webSocket : WebSocket | undefined;
  peerConnection : RTCPeerConnection;
  connected : boolean = false;
  
  private dataChangedSubject: Subject<void> = new Subject<void>();
  dataChanged$: Observable<void> = this.dataChangedSubject.asObservable();

  entries : Map<GameType, GameSettings[]> = new Map<GameType, GameSettings[]>;

  state : MatchMakingState = MatchMakingState.Standby;
  currentGame : Tournament | Match | undefined;

  constructor(private authService : AuthService) {
    this.entries.set(GameType.Match, []);
    this.entries.set(GameType.Tournament,[]);
    this.connectToServer();

    const pc_config = {
      iceServers: [
        {
            urls: "stun:stun.l.google.com:19302",
        },
      ],
    };
    this.peerConnection = new RTCPeerConnection(pc_config);
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
      this.connected = true;
    };
    this.webSocket.onerror = () => {
      this.connected = false;
    }
    this.webSocket.onclose = () => {
      this.connected = false;
    };
    this.webSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log(`message recieved ${data}`);
      if (data.type === 'new_match')
        this.entries.get(GameType.Match)?.push(new GameSettings(GameType.Match, data.match.name, data.match.tags, true));
      else if (data.type === 'new_tournament') 
        this.entries.get(GameType.Tournament)?.push(data.new_tournament_name)
      else if (data.type === 'del_tournament') {
        const tournaments = this.entries.get(GameType.Tournament);
        if (tournaments) {
          const index = tournaments.indexOf(data.del_tournament_name);
          if (index !== -1) {
            tournaments.splice(index, 1);
          }
        }
      }
      else if (data.type === 'del_match') {
        const matches = this.entries.get(GameType.Match);
        if (matches) {
          const index = matches.indexOf(data.del_match_name);
          if (index !== -1) {
            matches.splice(index, 1);
          }
        }
      }
      else if (data.type === 'match_tournament_list') {
        console.log(`list ${data.matches} ${data.tournaments}`);
        this.entries.set(GameType.Match, data.matches);
        this.entries.set(GameType.Tournament, data.tournaments);
      } else if (data.type.startsWith('webrtc/')) {
        const webrtcOper = data.type.substring(7);
        if (webrtcOper === "all_users"){// (allUsers: Array<{ id: string; email: string }>) => {
          let len = data.allUsers.length;
          if (len > 0) {
            this.createOffer();
          }
        } else if (webrtcOper === "getOffer"){//(sdp: RTCSessionDescription) => {
        //console.log(sdp);
          console.log("get offer");
          this.createAnswer(data.sdp);
        } else if(webrtcOper === "getAnswer"){//, (sdp: RTCSessionDescription) => {
          console.log("get answer");
          this.peerConnection?.setRemoteDescription(new RTCSessionDescription(data.sdp));
          //console.log(sdp);
        } else if (webrtcOper === "getCandidate"){//, (candidate: RTCIceCandidateInit) => {
          this.peerConnection?.addIceCandidate(new RTCIceCandidate(data.candidate)).then(() => {
            console.log("candidate add success");
          });
        }else
          return;
      }
      else
        return;
      this.dataChangedSubject.next();
    }
  }
  isConnected() : boolean{
    return this.connected && this.webSocket?.readyState === WebSocket.OPEN;
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
    console.log('new game called');
    if (this.isConnected()){
      let messageObject;
      if (gameSettings.gameType === GameType.Tournament){
        messageObject = { type: '/new_tournament', settings : gameSettings} ;
      } else if (gameSettings.gameType === GameType.Match){
        messageObject = { type: '/new_match', settings : gameSettings };
      }else
        return;
      this.sendMessage(JSON.stringify(messageObject));
      console.log('new match tournament message send');
    }
  }
  reloadMatchesTournamets(){
    console.log('reload called');
    if (this.isConnected()){
      let messageObject = {type : '/match_tournament_list'};
      this.sendMessage(JSON.stringify(messageObject));
    }
  }

  joinMatch(matchName : string){
    if (this.isConnected()){
      this.peerConnection
        ?.createOffer()
        .then(sdp => {
        console.log('service join match')
          this.peerConnection?.setLocalDescription(new RTCSessionDescription(sdp));
          let messageObject = {
            type: '/match/join',
            name: matchName,
            sdp: sdp 
          }
          this.sendMessage(JSON.stringify(messageObject));
          console.debug(`join match message sent, ${sdp.sdp}`);
        })
        .catch(error => {
            console.log(error);
        });
    }
  }
  async joinTournament(tournamentName : string){
    if (this.isConnected()){
      this.createOffer()
      const offer = await this.createOffer();
      if (offer !== undefined && offer !== null) {
        let messageObject = {
          type: '/tournament/join',
          name: tournamentName,
          sdp: offer 
        }
      }
    }
  }


  createOffer(): Promise<RTCSessionDescriptionInit | null> | undefined{
    return this.peerConnection
        ?.createOffer()
        .then(sdp => {
            console.log(sdp);
            return sdp;
        })
        .catch(error => {
            console.error("Error creating offer:", error);
            return null;
        });
  }
  createAnswer(sdp: RTCSessionDescription){
    this.peerConnection?.setRemoteDescription(new RTCSessionDescription(sdp)).then(() => {
        this.peerConnection?.createAnswer({
          offerToReceiveVideo: false,
          offerToReceiveAudio: false,
         })
          .then(sdp1 => {
                this.peerConnection?.setLocalDescription(new RTCSessionDescription(sdp1));
                const message = JSON.stringify({message : `/webrtc/answer ${sdp1}`});
                this.sendMessage(message);
                //this.sendMessage("answer", sdp1);
            })
            .catch(error => {
                console.log(error);
            });
    });
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
