import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, NgZone, ElementRef, ViewChild } from '@angular/core';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit{
  //globalChatMessages : Message[] = [];
  chatMessages : Map<string, Message[]> = new Map<string, Message[]>();
  newMessage: string = '';
  current_chat_name : string= '#global';

  webSocketUrl = 'ws://localhost:8000/chat/global/';

  webSocket : WebSocket;

  @ViewChild('messageBox') messageBox!: ElementRef;

  constructor(private http: HttpClient, private ngZone: NgZone) {
    const jwtToken = getCookie('access_token');
    if (jwtToken == null){
      console.log('failed to get cookie access token, log in');
    }
    this.webSocketUrl = `ws://localhost:8000/chat/global/?token=${jwtToken}`;
    this.webSocket = new WebSocket(this.webSocketUrl);
    this.webSocket.onopen = () => {
      console.log('WebSocket connection opened');
    };
  }

  initializeSocket(){
    this.ngZone.run(() => {
    this.chatMessages.set('#global',[]);
    this.chatMessages.set('ecamara',[]);
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
    };
  }

  getKeys() : string[]{
    return Array.from(this.chatMessages.keys());
  }

  ngOnInit(): void {
    // Scroll to the bottom of the message box when component initializes
    this.initializeSocket();
    this.scrollToBottom();
  }

  isConnected(){
    return this.webSocket.readyState === WebSocket.OPEN;
  }

  sendMessage() {
    if (this.newMessage.trim() !== '') {
      if (this.webSocket.readyState === WebSocket.OPEN) {
        if (this.webSocket.readyState === WebSocket.OPEN) {
          let messageObject;
          if (this.current_chat_name == '#global')
            messageObject = { message: `/global ${this.newMessage}` }; // Create a JavaScript object
          else
            messageObject = { message: `/pm ${this.current_chat_name} ${this.newMessage}` }; // Create a JavaScript object
          const jsonMessage = JSON.stringify(messageObject); // Convert the object to JSON string
          this.webSocket.send(jsonMessage); // Send the JSON string over the WebSocket connection
        }
      } else {
        console.error('WebSocket connection is not open');
      }
      //this.globalChatMessages.push({message: this.newMessage, sender: "me", date:"now"});
      this.newMessage = '';
    }
  }
  handleShiftEnter(event : any): void {
    if (event.shiftKey && event.key === 'Enter') {
      event.preventDefault(); // Prevent inserting a newline character
      this.newMessage += '\n'; // Insert a newline character in the message
    }
  }

  changeChannel(channel : string): void{
    this.current_chat_name = channel;
  }

  // Función para hacer autoscroll hacia abajo
  private scrollToBottom(): void {
    const scrollableDiv = document.querySelector('.overflow-y-scroll');
    if (scrollableDiv != null)
      scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
  }
}
