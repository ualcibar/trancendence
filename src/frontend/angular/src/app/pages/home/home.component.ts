import { Component, OnInit } from '@angular/core';

import { ChatComponent } from '../../components/chat/chat.component';
import {LobbySearchComponent} from '../../components/lobby-search/lobby-search.component';
import { LobbyMatchComponent } from '../../components/lobby-match/lobby-match.component';
import { LobbyTournamentComponent } from '../../components/lobby-tournament/lobby-tournament.component';

import { MatchmakingService, MatchMakingState } from '../../services/matchmaking.service';
import { CommonModule } from '@angular/common';
import { fadeInOut } from './animations';

enum HomeState{
    Home,
    Multiplayer,
    Local
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ChatComponent, LobbySearchComponent, CommonModule, LobbyMatchComponent, LobbyTournamentComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  animations: [fadeInOut]
})
export class HomeComponent implements OnInit{
    chatUnwrapped : boolean = false;
    state : HomeState;
    HomeState = HomeState;
    MatchMakingState = MatchMakingState;
    constructor(public matchmakingService : MatchmakingService) {
        this.state = HomeState.Home;
    }
    ngOnInit(): void {
    }
    changeState(newState : HomeState){
        this.state = newState;
        this.matchmakingService.sendMessage(JSON.stringify({type : '/reset'}));
    }
}

