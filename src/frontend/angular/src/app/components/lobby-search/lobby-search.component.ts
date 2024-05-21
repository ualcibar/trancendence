import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit, NgZone, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import {Observable, Subscription} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import { TournamentMatchMenuComponent } from '../tournament-match-menu/tournament-match-menu.component';
import { GameSettings, GameType, MatchmakingService } from '../../services/matchmaking.service';


@Component({
  selector: 'app-lobby-search',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AsyncPipe,
    TournamentMatchMenuComponent],
  templateUrl: './lobby-search.component.html',
  styleUrl: './lobby-search.component.css'
})
export class LobbySearchComponent implements OnInit, OnDestroy{
  //globalChatMessages : Message[] = [];
  current_entry : string= 'Match';
//  entries : Map<string, string[]> = new Map<string, string[]>;
  filtered_games$ : Observable<GameSettings[]>;

  private dataChangedSubscription: Subscription;
  myControl = new FormControl<string>('');
  @ViewChild('inputField') inputField!: ElementRef;

  showMatchTournamentMenu : boolean = false;

  @ViewChild('messageBox') messageBox!: ElementRef;

  constructor(private http: HttpClient, private ngZone: NgZone, private matchMakingService : MatchmakingService) {
    this.filtered_games$ = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        return value ? this._filter(value as string) : this.getMatches(this.current_entry).slice();
      }),
    );
    this.dataChangedSubscription = this.matchMakingService.dataChanged$.subscribe(() => {
      this.filtered_games$ = this.myControl.valueChanges.pipe(
        startWith(''),
        map(value => {
          return value ? this._filter(value as string) : this.getMatches(this.current_entry).slice();
        }),
      );
    });
  }

  ngOnInit(): void {
    this.refresh();
  }
  ngOnDestroy(): void {
    if (this.dataChangedSubscription) {
      this.dataChangedSubscription.unsubscribe();
    }
  }
  refresh(){
    this.matchMakingService.reloadMatchesTournamets();
  }

  isConnected(){
    return this.matchMakingService.isConnected();
  }

  sendMessage() {
	}

  changeEntry(entry: string): void {
    this.current_entry = entry;
    this.filtered_games$ = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        return value ? this._filter(value as string) : this.getMatches(this.current_entry).slice();
      }),
    );
    this.inputField.nativeElement.focus();
  }

	toggleMatchTournamentMenu() {
		this.showMatchTournamentMenu = !this.showMatchTournamentMenu;
	}

	scapekey() {
		this.showMatchTournamentMenu = false;
	}
	fieldSelected(username: string) {
		this.showMatchTournamentMenu= false;
	}

  getMatches(entry : string) : GameSettings[]{
    const matches : GameSettings[] | null = this.matchMakingService.getEntry(entry);
    if (matches)
      return matches;
    return [];
  }

  getEntries() : string[]{
    return Array.from(this.matchMakingService.getKeys());
  }
  
  new_match_tournament(newGame : any){
    this.matchMakingService.newGame(newGame);
  }

  joinGame(game : GameSettings){
    console.debug(`joining game called ${game.name}`);
    if (this.current_entry === GameType.Match)
      this.matchMakingService.joinMatch(game.name);
  }

	// Función para hacer autoscroll hacia abajo
	private scrollToBottom(): void {
		const scrollableDiv = document.querySelector('.overflow-y-scroll');
		if (scrollableDiv != null)
			scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
	}
  private _filter(name: string): GameSettings[] {
    const filterValue = name.toLowerCase();
    return this.getMatches(this.current_entry).filter(field => field.name.toLowerCase().includes(filterValue));
  }
}
