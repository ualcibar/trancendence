import { Injectable } from '@angular/core';
import {AuthService} from './auth.service';

enum GameType {
  Tournament = 'Tournament',
  Match = 'Match',
}

export class GameSettings{
  gameType : string;
  name : string;
  tags : string;
  publicPrivate : string;
  constructor (gameType : string, name : string, tags : string, publicPrivate : string){
    this.gameType =gameType;
    this.name = name;
    this.tags = tags;
    this.publicPrivate = publicPrivate;
  }
}

@Injectable({
  providedIn: 'root'
})
export class MatchmakingService {
  webSocketUrl = 'ws://localhost:8000/matchmaking/';
  webSocket : WebSocket | null = null;
  connected : boolean = false;
  
  entries : Map<string, string[]> = new Map<string, string[]>;
  constructor(private authService : AuthService) {
    this.entries.set('Matches', ['hola', 'hola', 'hola', 'hola']);
    this.entries.set('Tournaments',['hola2', 'hola3', 'hola3', 'hola4']);
    this.connectToServer();
  }
  
  connectToServer() {
    const jwtToken = this.authService.getCookie('access_token');
    if (jwtToken == null) {
      console.log('failed to get cookie access token, log in');
    }
    this.webSocketUrl = `ws://localhost:8000/matchmaking/?token=${jwtToken}`;
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
      if (data.type === 'new_match') {
        const matches = this.entries.get('Matches');
        if (matches)
          matches.push(data.new_match_name);
      }
      else if (data.type === 'new_tournament') {
        const tournaments = this.entries.get('Tournaments');
        if (tournaments)
          tournaments.push(data.new_tournament_name);
      }
      else if (data.type === 'del_tournament') {
        const tournaments = this.entries.get('Tournaments');
        if (tournaments) {
          const index = tournaments.indexOf(data.del_tournament_name);
          if (index !== -1) {
            tournaments.splice(index, 1);
          }
        }
      }
      else if (data.type === 'del_match') {
        const matches = this.entries.get('Matches');
        if (matches) {
          const index = matches.indexOf(data.del_match_name);
          if (index !== -1) {
            matches.splice(index, 1);
          }
        }
      }
      else if (data.type === 'match_tournamet_list') {
        this.entries.set('Matches', data.matches);
        this.entries.set('Tournaments', data.tournaments);
      }
    }
  }
  isConnected() : boolean{
    return this.connected && this.webSocket?.readyState === WebSocket.OPEN;
  }
  getEntry(entry_name : string) : string[] | null{
    const entry = this.entries.get(entry_name);
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
}
