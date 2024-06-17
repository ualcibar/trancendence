import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit, NgZone, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import {Observable, Subscription} from 'rxjs';
import {map, startWith} from 'rxjs/operators';

import { MatchmakingService, OnlineMatchSettings2 } from '../../services/matchmaking.service';
import { LogFilter, Logger } from '../../utils/debug';
import { OnlineMatchGeneratorComponent } from '../online-match-generator/online-match-generator-component';
import { HomeState, StateService } from '../../services/stateService';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-lobby-search',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AsyncPipe,
    OnlineMatchGeneratorComponent, TranslateModule
  ],
  templateUrl: './lobby-search.component.html',
  styleUrl: './lobby-search.component.css'
})
export class LobbySearchComponent implements OnInit, OnDestroy{
  //globalChatMessages : Message[] = [];
  current_entry : string= 'Match';
//  entries : Map<string, string[]> = new Map<string, string[]>;
  filtered_games$ : Observable<OnlineMatchSettings2[]>;

  private dataChangedSubscription: Subscription;
  myControl = new FormControl<string>('');
  @ViewChild('inputField') inputField!: ElementRef;

  showMatchTournamentMenu : boolean = false;

  @ViewChild('messageBox') messageBox!: ElementRef;

  //logger
  logger : Logger = new Logger(LogFilter.LobbySearchLogger, 'lobby search:')

  constructor(private matchMakingService : MatchmakingService,
              private state : StateService)
  {
    this.filtered_games$ = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        return value ? this._filter(value as string) : this.getMatches(this.current_entry).slice();
      }),
    );
    this.dataChangedSubscription = this.matchMakingService.dataChanged.subscribe(() => {
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
    this.matchMakingService.reloadMatches();
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

  showOnlineMatchGenerator(){
    this.state.changeHomeState(HomeState.OnlineMatchGenerator)
  }

	scapekey() {
		this.showMatchTournamentMenu = false;
	}
	fieldSelected(username: string) {
		this.showMatchTournamentMenu= false;
	}

  getMatches(entry : string) : OnlineMatchSettings2[]{
    return this.matchMakingService.getMatches(); 
  }
  
  new_match(settings : OnlineMatchSettings2){
    this.matchMakingService.newOnlineMatch(settings);
  }

  joinGame(settings : OnlineMatchSettings2){
    this.logger.info(`joining game called ${settings.name}`);
    this.matchMakingService.joinMatch(settings.name);
  }

	// Función para hacer autoscroll hacia abajo
	private scrollToBottom(): void {
		const scrollableDiv = document.querySelector('.overflow-y-scroll');
		if (scrollableDiv != null)
			scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
	}
  private _filter(name: string): OnlineMatchSettings2[] {
    const filterValue = name.toLowerCase();
    return this.getMatches(this.current_entry).filter(field => field.name.toLowerCase().includes(filterValue));
  }
}
