import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OnInit, NgZone, ElementRef, ViewChild } from '@angular/core';
import {AuthService} from './auth.service';

class Message {
  message : string = '';
  sender: string = '';
  date: string = '';
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

  webSocketUrl = 'wss://localhost/api/chat/global';

  webSocket : WebSocket;

  constructor(private http: HttpClient, private ngZone: NgZone, private authService : AuthService) {
    this.chatMessages.set('#global', []);

    const jwtToken = this.authService.getCookie('access_token');
    if (jwtToken == null) {
      console.log('failed to get cookie access token, log in');
    }

    this.webSocketUrl = `${this.webSocketUrl}/?token=${jwtToken}`;
    this.webSocket = new WebSocket(this.webSocketUrl);

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
      const evenData = JSON.parse(event.data);
      const actualHourDate = new Date();
      const actualHour = `${actualHourDate.getHours()}:${actualHourDate.getMinutes()}`;
      let targetChannel = this.current_chat_name;
      let message: string;
      console.log('message incoming');
      if (evenData.type == 'private_message') {
        console.log('message for me');
        console.log(evenData);
        if (!this.chatMessages.has(evenData.user)) {
          this.chatMessages.set(evenData.user, []);
        }
        targetChannel = evenData.user;
        message = evenData.message;
      } else if (evenData.type == 'private_message_delivered') {
        targetChannel = this.current_chat_name;
        message = evenData.message;
      } else if (evenData.type == 'user_list') {
        this.users = new Set(evenData.users);
        return;
      } else if (evenData.type == 'user_join') {
        this.users.add(evenData.user);
        return;
      } else if (evenData.type == 'user_leave') {
        this.users.delete(evenData.user);
        return;
      }
      else if (evenData.message.startsWith('/global ')) {
        targetChannel = '#global';
        message = evenData.message.substring('/global '.length);
      } else {
        console.log(evenData);
        console.log('message no current channel');
        return;
      }
      const chatMessage = this.chatMessages.get(targetChannel);
      if (chatMessage)
        chatMessage.push({ message: message, sender: evenData.user, date: actualHour });
      else
        console.log('no target channel');
    };
  }
  isConnected(): boolean{
    return this.connected && this.webSocket.readyState === WebSocket.OPEN;
  }
  getKeys() : string[]{
    return Array.from(this.chatMessages.keys());
  }
  sendMessage(message : string, target : string) : boolean{
    if (this.isConnected()) {
      let messageObject;
      if (target == '#global')
        messageObject = { message: `/global ${message}` }; // Create a JavaScript object
      else
        messageObject = { message: `/pm ${target} ${message}` }; // Create a JavaScript object
      const jsonMessage = JSON.stringify(messageObject); // Convert the object to JSON string
      this.webSocket.send(jsonMessage); // Send the JSON string over the WebSocket connection
      return true;
    } else {
      console.error('WebSocket connection is not open');
      return false;
    }
    return false;
  }
  getUsers(): Set<string>{
    return this.users;
  }
  addChat(username : string){
    this.chatMessages.set(username, []);
  }
  getChatMessages(chat : string): Message[]{
    const messages = this.chatMessages.get(chat);
    if (messages)
      return messages;
    return [];
  }
}
