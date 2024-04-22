import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, NgZone, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';

import { SearchBarComponent } from '../search-bar/search-bar.component';
import { ChatService, Message } from '../../services/chat.service';

import { fadeInOut } from '../../../assets/animations/fadeInOut';

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
  styleUrls: ['./chat.component.css'],
  animations: [fadeInOut]
})
export class ChatComponent implements OnInit{
	newMessage: string = '';
	current_chat_name : string= '#global';
	showSearchBar : boolean = false;
	chatMessages: Message[] = [];

	@ViewChild('messageBox') messageBox!: ElementRef;

	constructor(private http: HttpClient, private ngZone: NgZone, private chatService : ChatService, private cdr: ChangeDetectorRef) { }

	getKeys() : string[]{
		return this.chatService.getKeys();
	}

	ngOnInit(): void {
		this.fetchChatMessages();
		this.scrollToBottom();
	}

	fetchChatMessages(): void {
		const chat = this.current_chat_name;
		this.chatMessages = this.chatService.getChatMessages(chat);

		this.cdr.detectChanges();
	}

	sendMessage(event: any | undefined = undefined) {
		event?.preventDefault();
		
		console.log(this.newMessage + " : " + this.current_chat_name);
		if (this.newMessage.trim() !== '') {
			this.chatService.sendMessage(this.newMessage, this.current_chat_name);
			this.newMessage = '';
		}
	}

	changeChannel(channel: string): void {
		this.current_chat_name = channel;
		this.fetchChatMessages();
	}

	togleSearchBar() {
		this.showSearchBar = !this.showSearchBar;
	}

	scapekey() {
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
		setTimeout(() => {
			this.scrollToBottom();
		}, 0);
		return this.chatService.getChatMessages(chat);
	}
		
	private scrollToBottom(): void {
		const scrollableDiv = document.querySelector('.overflow-y-auto');
		if (scrollableDiv != null)
			scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
	}
}
