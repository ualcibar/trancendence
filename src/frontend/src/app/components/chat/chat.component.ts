import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';

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
  globalChatMessages : Message[] = [];
  newMessage: string = '';
  userChats: string[] = ['eneko', 'patata', 'gasteDineroEnRoblox'];

  webSocketUrl = 'ws://localhost:8000/chat/global/';

  webSocket : WebSocket;

  @ViewChild('messageBox') messageBox!: ElementRef;

  constructor(private http: HttpClient) {
    const jwtToken = getCookie('access_token');
    if (jwtToken == null){
      console.log('failed to get cookie access token, log in');
    }
    this.webSocketUrl = `ws://localhost:8000/chat/global/?token=${jwtToken}`;
    this.webSocket = new WebSocket(this.webSocketUrl);
    this.webSocket.onopen = () => {
      console.log('WebSocket connection opened');
    };

    // Event handler for when the WebSocket connection is closed
    this.webSocket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Event handler for incoming messages from the WebSocket server
    this.webSocket.onmessage = (event) => {
      const evenData = JSON.parse(event.data);
      const actualHourDate = new Date();
      const actualHour = `${actualHourDate.getHours()}:${actualHourDate.getMinutes()}`;
      this.globalChatMessages.push({message: evenData.message, sender: evenData.user, date:actualHour});
      setTimeout(() => {
        this.scrollToBottom();
      }, 0);
    };

    // Event handler for WebSocket errors
    this.webSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  ngOnInit(): void {
    // Scroll to the bottom of the message box when component initializes
    this.scrollToBottom();
  }

  isConnected(){
    return this.webSocket.readyState === WebSocket.OPEN;
  }

  sendMessage() {
    if (this.newMessage.trim() !== '') {
      if (this.webSocket.readyState === WebSocket.OPEN) {
        if (this.webSocket.readyState === WebSocket.OPEN) {
          const messageObject = { message: this.newMessage }; // Create a JavaScript object
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

  // Función para hacer autoscroll hacia abajo
  private scrollToBottom(): void {
    const scrollableDiv = document.querySelector('.overflow-y-scroll');
    if (scrollableDiv != null)
      scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
  }
}
