import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, NgZone, ElementRef, ViewChild } from '@angular/core';

import { SearchBarComponent } from '../search-bar/search-bar.component';
import { ChatService } from '../../services/chat.service';
class Message {
  message : string = '';
  sender: string = '';
  date: string = '';
}

function getCookie(name: string): string|null {
	const nameLenPlus = (name.length + 1);
	return document.cookie
		.split(';')
		.map(c => c.trim())
		.filter(cookie => {
			return cookie.substring(0, nameLenPlus) === `${name}=`;
		})
		.map(cookie => {
			return decodeURIComponent(cookie.substring(nameLenPlus));
		})[0] || null;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchBarComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit{
  newMessage: string = '';
  current_chat_name : string= '#global';
  //globalChatMessages : Message[] = [];
  /*chatMessages : Map<string, Message[]> = new Map<string, Message[]>();*/
  /* users: Set<string> = new Set<string>();

  webSocketUrl = 'ws://localhost:8000/chat/global/';

  webSocket : WebSocket;*/

  showSearchBar : boolean = false;

  @ViewChild('messageBox') messageBox!: ElementRef;

  constructor(private http: HttpClient, private ngZone: NgZone, private chatService : ChatService) {
    /*const jwtToken = getCookie('access_token');
    if (jwtToken == null){
      console.log('failed to get cookie access token, log in');
    }
    this.webSocketUrl = `ws://localhost:8000/chat/global/?token=${jwtToken}`;
    this.webSocket = new WebSocket(this.webSocketUrl);
    this.webSocket.onopen = () => {
      console.log('WebSocket connection opened');
    };*/
  }

  initializeSocket(){
    /*this.ngZone.run(() => {
    this.chatMessages.set('#global',[]);
    });
    // Event handler for when the WebSocket connection is closed
    this.webSocket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Event handler for incoming messages from the WebSocket server
    this.webSocket.onmessage = (event) => {
      this.ngZone.run(() => {
        const evenData = JSON.parse(event.data);
        const actualHourDate = new Date();
        const actualHour = `${actualHourDate.getHours()}:${actualHourDate.getMinutes()}`;
        let targetChannel = this.current_chat_name;
        let message: string;
        console.log('message incoming');
        if (evenData.type == 'private_message'){
          console.log('message for me');
          console.log(evenData);
          if (!this.chatMessages.has(evenData.user)){
            this.chatMessages.set(evenData.user,[]); 
          }
          targetChannel = evenData.user;
          message = evenData.message;
        } else if (evenData.type == 'private_message_delivered'){
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
        setTimeout(() => {
          this.scrollToBottom();
        }, 0);
      });
      
    };

    // Event handler for WebSocket errors
    this.webSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };*/
  }

  getKeys() : string[]{
    return this.chatService.getKeys();
  }

  ngOnInit(): void {
    // Scroll to the bottom of the message box when component initializes
    this.initializeSocket();
    this.scrollToBottom();
  }

  sendMessage() {
	  if (this.newMessage.trim() !== '') {
      this.chatService.sendMessage(this.newMessage, this.current_chat_name);
      this.newMessage = '';
    }
	}
	handleShiftEnter(event: any): void {
		if (event.shiftKey && event.key === 'Enter') {
			event.preventDefault(); // Prevent inserting a newline character
			this.newMessage += '\n'; // Insert a newline character in the message
		}
	}

	changeChannel(channel: string): void {
		this.current_chat_name = channel;
	}

	togleSearchBar() {
		this.showSearchBar = !this.showSearchBar;
	}
	scapekey() {
		console.log('scape pressed');
		this.showSearchBar = false;
	}
	fieldSelected(username: string) {
		this.ngZone.run(() => {
      this.chatService.addChat(username);
		});
		this.showSearchBar = false;
	}
	getUsers() : string[]{
    return Array.from(this.chatService.getUsers());
  }
  getChatMessages(chat : string) : Message[]{
    return this.chatService.getChatMessages(chat);
  }
	
  private scrollToBottom(): void {
		const scrollableDiv = document.querySelector('.overflow-y-scroll');
		if (scrollableDiv != null)
			scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
	}

}
