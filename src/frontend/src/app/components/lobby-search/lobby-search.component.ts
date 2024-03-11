import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit, NgZone, ElementRef, ViewChild } from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { AsyncPipe } from '@angular/common';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
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
  selector: 'app-lobby-search',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    SearchBarComponent,
    FormsModule,
    ReactiveFormsModule,
    AsyncPipe],
  templateUrl: './lobby-search.component.html',
  styleUrl: './lobby-search.component.css'
})
export class LobbySearchComponent {
  //globalChatMessages : Message[] = [];
  current_entry : string= 'Matches';
  entries : Map<string, string[]> = new Map<string, string[]>;
  filtered_matches$ : Observable<string[]>;

  myControl = new FormControl<string>('');
  @ViewChild('inputField') inputField!: ElementRef;
  webSocketUrl = 'ws://localhost:8000/matchmaking/';

  webSocket : WebSocket;

  showSearchBar : boolean = false;

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
    this.filtered_matches$ = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        return value ? this._filter(value as string) : this.getMatches(this.current_entry).slice();
      }),
    );
  }

  initializeSocket(){
    // Event handler for when the WebSocket connection is closed
    this.webSocket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Event handler for incoming messages from the WebSocket server
    this.webSocket.onmessage = (event) => {
    };

    // Event handler for WebSocket errors
    this.webSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }


  ngOnInit(): void {
    // Scroll to the bmttom of the message box when component initializes
    this.entries.set('Matches',['hola', 'patata', 'buenas', 'patata', 'buenas', 'patata', 'buenas', 'patata', 'buenas', 'patata', 'buenas', 'patata', 'buenas', 'patata', 'buenas', 'patata', 'buenas', 'patata', 'buenas', 'patata', 'buenas', 'patata', 'buenas']);
    this.entries.set('Tournaments',[]);
    this.initializeSocket();
  }

  isConnected(){
    return this.webSocket.readyState === WebSocket.OPEN;
  }

  sendMessage() {
	}

  changeEntry(entry: string): void {
    this.current_entry = entry;
    this.filtered_matches$ = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        return value ? this._filter(value as string) : this.getMatches(this.current_entry).slice();
      }),
    );
    this.inputField.nativeElement.focus();
    console.log(`entry : ${this.current_entry}`);
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
		});
		this.showSearchBar = false;
	}

	getOnlineUsers(){
		if (this.webSocket.readyState === WebSocket.OPEN) {
			let messageObject = { message: "/list" }; // Create a JavaScript object
			const jsonMessage = JSON.stringify(messageObject); // Convert the object to JSON string
			this.webSocket.send(jsonMessage); // Send the JSON string over the WebSocket connection
		}
	}

  getMatches(entry : string) : string[]{
    const matches : string[] | undefined = this.entries.get(entry);
    if (matches)
      return matches;
    return [];
  }

  getEntries() : string[]{
    return Array.from(this.entries.keys());
  }
	// Función para hacer autoscroll hacia abajo
	private scrollToBottom(): void {
		const scrollableDiv = document.querySelector('.overflow-y-scroll');
		if (scrollableDiv != null)
			scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
	}
  private _filter(name: string): string[] {
    const filterValue = name.toLowerCase();
    return this.getMatches(this.current_entry).filter(field => field.toLowerCase().includes(filterValue));
  }
}