import { Injectable } from '@angular/core';
import { NgZone } from '@angular/core';
import {AuthService, PrivateUserInfo, UserInfo} from './auth.service';
import { LogFilter, Logger } from '../utils/debug';
import { ChatState, StateService } from './stateService';
import { toEnum } from '../utils/help_enum';
import { OnlineMatchSettings2 } from './matchmaking.service';

import { ip } from '../../main';

export interface MessageI{
  message : string;
  id : number;
  sender: UserInfo;
  date: string;
  type : string;
  invitation : OnlineMatchSettings2 | undefined;
  target : string;
}

export enum MessageType{
  Text = 'Text',
  Invitation = 'InvitationOpen',
  InvitationClosed = 'InvitationClosed'
}

export class Message {
  message : string;
  id : number;
  sender: UserInfo;
  date: string;
  type : MessageType;
  invitation : OnlineMatchSettings2 | undefined;
  target : string;

  toString(): string{
    return `message : ${this.message}, sender ${this.sender}`;
  }

  constructor(message: string, id: number, sender: UserInfo, date: string, type : MessageType, invitation : OnlineMatchSettings2 | undefined, target : string) {
    this.message = message;
    this.id = id;
    this.sender = sender;
    this.date = date;
    this.type = type;
    this.invitation = invitation;
    this.target = target;
  }

  static fromI(values : MessageI) : Message | undefined{
    const type = toEnum(MessageType, values.type);
    if (!type)
      return undefined;
    const sender = UserInfo.fromI(values.sender)
    if (!sender)
      return undefined
    if (type === MessageType.Invitation){
      if (!values.invitation)
        return undefined;
      const matchSettings = OnlineMatchSettings2.fromI(values.invitation)
      if (!matchSettings)
        return undefined
      return new Message(values.message, values.id, sender, values.date, type, matchSettings, values.target);
    }
    return new Message(values.message, values.id, sender, values.date, type, undefined, values.target);
  }
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  //backend connection
  webSocketUrl = 'wss://' + ip + ':1501/ws/chat/global/';
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
      this.logger.error('Failed to get Cookie Access Token, please, log in');
      return;
    }
    console.log(this.webSocketUrl);

    // Gestion del Websocket
    this.webSocket = new WebSocket(`${this.webSocketUrl}?token=${jwtToken}`);

    this.webSocket.onopen = () => {
      this.logger.info('websocket connection opened');
      this.state.changeChatState(ChatState.Connected);
      //this.connectedSubject.next(true);
    }

    this.webSocket.onclose = () => {
      this.logger.info('websocket connection closed');
      this.state.changeChatState(ChatState.Disconnected);
      //this.connectedSubject.next(false);
    }

    this.webSocket.onerror = (error) => {
      this.logger.error('websocket error:', error);
    };

    this.webSocket.onmessage = (event) => {
      if (!this.authService.userInfo)
        return
      const data = JSON.parse(event.data);
      let targetChannel = this.current_chat_name;
      let messageI: MessageI;

      this.ngZone.run(() => {
        this.logger.info("Channel type: " + data.type);
        switch (data.type) {
          case 'private_message':
            if (this.authService.isUserBlocked(data.message.sender.id))
              return
            if (!this.chatMessages.has(data.user)) {
              this.chatMessages.set(data.user, []);
            }
            targetChannel = data.user;
            messageI = data.message;
            break;
          case 'private_message_delivered':
            targetChannel = data.target;
            messageI = data.message;
            break;
          case 'global_message':
            if (this.authService.isUserBlocked(data.message.sender.id))
              return
            targetChannel = '#global';
            messageI = data.message;
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
        const chatMessages = this.chatMessages.get(targetChannel);
        if (chatMessages){
          const message = Message.fromI(messageI);
          if (!message)
            this.logger.error('failed to parse message')
          else{
            console.log('avatar: ', message.sender.avatarUrl)
            chatMessages.push(message);
          }
        }
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

  sendMessage(message : Message) {
    let messageObject;
    if (message.target == '#global')
      messageObject = { type : '/global', message : message};
    else
      messageObject = { type : '/pm', message : message, target : message.target };
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
