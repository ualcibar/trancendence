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
  @ViewChild('messageBox') messageBox!: ElementRef;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Scroll to the bottom of the message box when component initializes
    this.scrollToBottom();
  }

  sendMessage() {
    if (this.newMessage.trim() !== '') {
      this.globalChatMessages.push({message: this.newMessage, sender: "me", date:"now"});
      this.newMessage = '';
      setTimeout(() => {
        this.scrollToBottom();
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
