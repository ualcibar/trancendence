import { Component, OnInit } from '@angular/core';

import { ChatComponent } from '../../components/chat/chat.component';
import {LobbySearchComponent} from '../../components/lobby-search/lobby-search.component';
import { LobbyMatchComponent } from '../../components/lobby-match/lobby-match.component';
import { LobbyTournamentComponent } from '../../components/lobby-tournament/lobby-tournament.component';
import { TournamentMatchMenuComponent } from '../../components/tournament-match-menu/tournament-match-menu.component';

import { MatchmakingService, MatchMakingState } from '../../services/matchmaking.service';
import { CommonModule } from '@angular/common';

import { fadeInOut } from '../../../assets/animations/fadeInOut';

enum HomeState{
    Home,
    Multiplayer,
    Local
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ChatComponent, LobbySearchComponent, CommonModule, LobbyMatchComponent, LobbyTournamentComponent, TournamentMatchMenuComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  animations: [fadeInOut]
})
export class HomeComponent implements OnInit{
    chatUnwrapped : boolean = false;
    isAnimating : boolean = false;
    state : HomeState;
    HomeState = HomeState;
    MatchMakingState = MatchMakingState;
    constructor(public matchmakingService : MatchmakingService) {
        this.state = HomeState.Home;
    }
    ngOnInit(): void {
    }

    changeState(newState: HomeState): void {
        this.state = newState; // Cambia el estado
        this.isAnimating = true;
        console.log(this.isAnimating);
    
        // Espera un tiempo antes de marcar que la animación ha terminado
        setTimeout(() => {
          this.isAnimating = false;
        }, 301); // Ajusta este valor según la duración de tu animación
    }
}

