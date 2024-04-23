import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OnInit, NgZone, ElementRef, ViewChild } from '@angular/core';
import {AuthService} from './auth.service';
import { EventDispatcher } from 'three';

export class Message {
  message : string = '';
  id : number;
  sender: string = '';
  date: string = '';

  toString(): string{
    return `message : ${this.message}, sender ${this.sender}`;
  }

  constructor(message: string, id: number, sender: string, date: string) {
    this.message = message;
    this.id = id;
    this.sender = sender;
    this.date = date;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  chatMessages : Map<string, Message[]> = new Map<string, Message[]>();
  newMessage: string = '';
  current_chat_name : string= '#global';
  users: Set<string> = new Set<string>();
  connected : boolean = false;

  webSocketUrl = 'wss://localhost/ws/chat/global/';
  //webSocketUrl = 'disabled';

  webSocket : WebSocket;

  constructor(private http: HttpClient, private ngZone: NgZone, private authService : AuthService) {
    this.chatMessages.set('#global', []);

    const jwtToken = this.authService.getCookie('access_token');
    if (jwtToken == null) {
      console.log('failed to get cookie access token, log in');
    }

    this.webSocket = new WebSocket(`${this.webSocketUrl}?token=${jwtToken}`);

    this.webSocket.onopen = () => {
      console.log('WebSocket connection opened');
      this.connected = true;
    };
    this.webSocket.onclose = () => {
      console.log('WebSocket connection closed');
      this.connected = false;
    };
    this.webSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.connected = true;
    };
    this.webSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const actualHourDate = new Date();
      const actualHour = `${actualHourDate.getHours()}:${actualHourDate.getMinutes()}`;
      let targetChannel = this.current_chat_name;
      let message: string;
      this.ngZone.run(() => {
        console.log("Channel type: " + data.type);
        switch (data.type){ /// GLOBAL IGNORA SWITCH, LUEGO ENTRA DOS VECES; es posble que #global no entre en data.type
          case 'private_message':
            if (!this.chatMessages.has(data.user)) {
              this.chatMessages.set(data.user, []);
            }
            targetChannel = data.user;
            message = data.message;
            break;
          case 'private_message_delivered':
            console.log("!!!! Has recibido de " + data.user + " el siguiente mensaje: " + data.message);
            targetChannel = data.user;
            message = data.message;
            break;
          case 'global_message':
            targetChannel = '#global';
            message = data.message;
            console.log("lo he mandado al global tambien");
            break;
          case 'user_list':
            this.users = new Set(data.users);
            return;
          case 'user_join':
            this.users.add(data.user);
            return;
          case 'user_leave':
            this.users.delete(data.user);
            return;
          default:
            console.log(data);
            console.log('message no current channel');
            return;
        }

        const chatMessage = this.chatMessages.get(targetChannel);
        if (chatMessage)
          chatMessage.push({ message: message, id: data.id, sender: data.user, date: actualHour });
        else
          console.log('no target channel');
      });
    };
  }
  isConnected(): boolean{
    return this.connected && this.webSocket.readyState === WebSocket.OPEN;
  }

  getKeys() : string[]{
    return Array.from(this.chatMessages.keys());
  }

  sendMessage(message : string, target : string) : boolean{
    console.log(target);
    if (this.isConnected()) {
      let messageObject;
      if (target == '#global')
        messageObject = { type : '/global', message : message}; // Create a JavaScript object
      else
        messageObject = { type : '/pm', message : message, target : target }; // Create a JavaScript object
      const jsonMessage = JSON.stringify(messageObject); // Convert the object to JSON string
      this.webSocket.send(jsonMessage); // Send the JSON string over the WebSocket connection
      return true;
    } else {
      console.error('WebSocket connection is not open');
      return false;
    }
  }

  getUsers(): Set<string>{
    return this.users;
  }
  
  addChat(username : string){
    this.chatMessages.set(username, []);
  }

  getChatMessages(chat : string): Message[]{
    const messages = this.chatMessages.get(chat);
    if (messages){
      return messages;
    }
    return [];
  }
}
