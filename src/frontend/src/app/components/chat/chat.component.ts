import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';

class Message {
  message : string = '';
  sender: string = '';
  date: string = '';
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
  messages: string[] = ['message1', 'patata', 'roblox pay to win'];
  newMessage: string = '';
  userChats: string[] = ['eneko', 'patata', 'gasteDineroEnRoblox'];

  webSocketUrl = 'ws://localhost:8000/chat/global/';

  webSocket : WebSocket;

  @ViewChild('messageBox') messageBox!: ElementRef;

  constructor(private http: HttpClient) {
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
      console.log('Received message from server:', event.data);
      this.globalChatMessages.push({message: event.data['message'], sender: event.data.user, date:'befornow'});
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
      setTimeout(() => {
        //this.scrollToBottom();
      }, 0);
    }
  }
  handleShiftEnter(event : any): void {
    if (event.shiftKey && event.key === 'Enter') {
      event.preventDefault(); // Prevent inserting a newline character
      this.newMessage += '\n'; // Insert a newline character in the message
    }
  }
  private scrollToBottom(): void {
    try {
      this.messageBox.nativeElement.scrollTop = this.messageBox.nativeElement.scrollHeight;
    } catch (err) {
      console.error(err);
    }
  }
}
