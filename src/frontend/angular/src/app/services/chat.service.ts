import { Injectable } from '@angular/core';
import { NgZone } from '@angular/core';
import {AuthService, PrivateUserInfo} from './auth.service';
import { BehaviorSubject } from 'rxjs';
import { LogFilter, Logger } from '../utils/debug';
import { ChatState, MatchmakingState, StateService } from './stateService';

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
  //backend connection
  webSocketUrl = 'wss://localhost:1501/ws/chat/global/';
  webSocket: WebSocket | undefined;

  //chat 
  chatMessages: Map<string, Message[]> = new Map<string, Message[]>();
  current_chat_name: string = '#global';
  users: Set<string> = new Set<string>();

  //logger
  private  logger: Logger = new Logger(LogFilter.ChatServiceLogger, 'chatService :');

  constructor(private ngZone: NgZone, private authService: AuthService, private state: StateService) {
    this.chatMessages.set('#global', []);
    this.authService.subscribe((loggedIn: PrivateUserInfo | undefined) => {
      if (loggedIn && this.isClosed()) {
        this.connectToWebsocket();
      } else if (!loggedIn && this.isConnected()) {
        this.disconectFromWebsocket();
      }
    });
  }
  
  connectToWebsocket() {
    if (this.isConnected()) {
      return;
    }

    const jwtToken = this.authService.getCookie('access_token');
    if (!jwtToken) {
      console.error('Failed to get Cookie Access Token, please, log in');
      return;
    }

    // Gestion del Websocket
    this.webSocket = new WebSocket(`${this.webSocketUrl}?token=${jwtToken}`);

    this.webSocket.onopen = () => {
      console.log('Chat websocket connection opened');
      this.state.changeChatState(ChatState.Connected);
      //this.connectedSubject.next(true);
    }

    this.webSocket.onclose = () => {
      console.log('Chat websocket connection closed');
      this.state.changeChatState(ChatState.Disconnected);
      //this.connectedSubject.next(false);
    }

    this.webSocket.onerror = (error) => {
      console.error('Chat websocket error:', error);
    };

    this.webSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const actualHourDate = new Date();
      const actualHour = `${actualHourDate.getHours()}:${actualHourDate.getMinutes()}`;
      let targetChannel = this.current_chat_name;
      let message: string;

      this.ngZone.run(() => {
        this.logger.info("Channel type: " + data.type);
        switch (data.type) {
          case 'private_message':
            if (!this.chatMessages.has(data.user)) {
              this.chatMessages.set(data.user, []);
            }
            targetChannel = data.user;
            message = data.message;
            break;
          case 'private_message_delivered':
            targetChannel = data.target;
            message = data.message;
            break;
          case 'global_message':
            targetChannel = '#global';
            message = data.message;
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
            this.logger.error(data);
            return;
        }

        const chatMessage = this.chatMessages.get(targetChannel);
        if (chatMessage)
          chatMessage.push({message: message, id: data.id, sender: data.sender, date: actualHour});
        else
          console.log('No target channel');
      });
    }
  }

  disconectFromWebsocket() {
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = undefined;
      this.state.changeChatState(ChatState.Disconnected)
    }
    //this.connectedSubject.next(false);
  }

  isConnected(): boolean{
    return this.webSocket !== undefined && this.webSocket.readyState === this.webSocket.OPEN
    //return this.connectedSubject.value;
  }

  isClosed() : boolean{
    return this.webSocket === undefined || this.webSocket.readyState === this.webSocket.CLOSED
  }

  getKeys() : string[]{
    return Array.from(this.chatMessages.keys());
  }

  sendMessage(message : string, target : string) {
    let messageObject;
    if (target == '#global')
      messageObject = { type : '/global', message : message};
    else
      messageObject = { type : '/pm', message : message, target : target };
    const jsonMessage = JSON.stringify(messageObject);
    this.webSocket?.send(jsonMessage);
  }

  getUsers(): Set<string>{
    return this.users;
  }
  
  addChat(username : string){
    if (!this.chatMessages.get(username))
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
