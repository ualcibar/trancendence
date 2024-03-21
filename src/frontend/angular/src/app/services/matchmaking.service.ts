import { Injectable } from '@angular/core';
import {AuthService} from './auth.service';
import { Subject, Observable, interval } from 'rxjs';
export enum GameType {
  Tournament = 'Tournament',
  Match = 'Match',
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
  webSocket : WebSocket | null = null;
  connected : boolean = false;
  
  private dataChangedSubject: Subject<void> = new Subject<void>();
  dataChanged$: Observable<void> = this.dataChangedSubject.asObservable();

  entries : Map<GameType, GameSettings[]> = new Map<GameType, GameSettings[]>;
  constructor(private authService : AuthService) {
    this.entries.set(GameType.Match, []);
    this.entries.set(GameType.Tournament,[]);
    this.connectToServer();
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
        messageObject = { message: `/new_tournament ${JSON.stringify(gameSettings)}` };
      } else if (gameSettings.gameType === GameType.Match){
        messageObject = { message: `/new_match ${JSON.stringify(gameSettings)}` };
      }else
        return;
      const jsonMessage = JSON.stringify(messageObject); // Convert the object to JSON string
      if(this.webSocket){
        this.webSocket.send(jsonMessage);
        console.log('new match tournament message send');
      }
    }
  }
  reloadMatchesTournamets(){
    console.log('reload called');
    if (this.isConnected()){
      let messageObject = {message : '/match_tournament_list'}
      this.webSocket?.send(JSON.stringify(messageObject));
    }
  }
}
