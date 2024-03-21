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
  showSearchBar : boolean = false;

  @ViewChild('messageBox') messageBox!: ElementRef;

  constructor(private http: HttpClient, private ngZone: NgZone, private chatService : ChatService) {
    
  }

  getKeys() : string[]{
    return this.chatService.getKeys();
  }

  ngOnInit(): void {
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
