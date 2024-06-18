import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, NgZone, ElementRef, ViewChild, ChangeDetectorRef, Input } from '@angular/core';

import { SearchBarComponent } from './search-bar/search-bar.component';
import { ChatService, Message, MessageType } from '../../services/chat.service';

import { easeOut } from '../../../assets/animations/easeOut';
import { AuthService } from '../../services/auth.service';
import { MatchmakingService } from '../../services/matchmaking.service';
import { TranslateModule } from '@ngx-translate/core';
import { StateService } from '../../services/stateService';

import { Router } from '@angular/router';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchBarComponent, TranslateModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  animations: [easeOut]
})
export class ChatComponent implements OnInit{
	newMessage: string = '';
	current_chat_name : string= '#global';
	showSearchBar : boolean = false;
	chatMessages: Message[] = [];
	MessageType = MessageType;
	@Input() defaultChat : string | undefined;

	@ViewChild('messageBox') messageBox!: ElementRef;

	constructor(private http: HttpClient,
		private ngZone: NgZone,
		private chatService : ChatService,
		private cdr: ChangeDetectorRef,
		private auth : AuthService,
		public matchmaking : MatchmakingService,
		private router : Router
	) {
	}

	getKeys() : string[]{
		return this.chatService.getKeys();
	}

	ngOnInit(): void {
		this.fetchChatMessages();
		this.scrollToBottom();
		if (this.defaultChat){
			this.current_chat_name = this.defaultChat
			this.chatService.addChat(this.defaultChat)
		}
	}

/*	ngOnDestroy(): void {
		this.chatService.webSocket?.close();
	}*/


	fetchChatMessages(): void {
		const chat = this.current_chat_name;
		this.chatMessages = this.chatService.getChatMessages(chat);

		this.cdr.detectChanges();
	}

	sendMessageText(event: any | undefined = undefined) {
		event?.preventDefault();
		
		console.log(this.newMessage + " : " + this.current_chat_name);
		if (this.newMessage.trim() !== '') {
      		const actualHourDate = new Date();
      		const actualHour = `${actualHourDate.getHours()}:${actualHourDate.getMinutes()}`;
			const message = new Message(this.newMessage, -1, this.auth.userInfo!.info, actualHour, MessageType.Text, undefined, this.current_chat_name)
			this.chatService.sendMessage(message);
			this.newMessage = '';
		}
	}
	sendMessageInvitation(event: any | undefined = undefined) {
		event?.preventDefault();
		console.log(this.newMessage + " : " + this.current_chat_name);
		const actualHourDate = new Date();
		const actualHour = `${actualHourDate.getHours()}:${actualHourDate.getMinutes()}`;
		const matchSettings = this.matchmaking.getOnlineMatchSettings();
		if (!matchSettings) {
			console.error('chat component: failed to get current match settings in invitation')
			return;
		}
		const message = new Message(this.newMessage, -1, this.auth.userInfo!.info, actualHour, MessageType.Invitation, matchSettings, this.current_chat_name)
		this.chatService.sendMessage(message);
		this.newMessage = '';
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

	canJoin(message : Message){
		console.log('can join', message.sender.id !== this.auth.userInfo!.info.id)
		return message.sender.id !== this.auth.userInfo!.info.id && this.matchmaking.matchAvailable(message.invitation!.name)		
	}
	joinMatch(message : Message){
		this.matchmaking.joinMatch(message.invitation!.name)
	}
		
	private scrollToBottom(): void {
		const scrollableDiv = document.querySelector('.overflow-y-auto');
		if (scrollableDiv != null)
			scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
	}

	goToProfile(userId : number){
		this.router.navigate([`/profile/${userId}`])
		//!todo
	  }
}
