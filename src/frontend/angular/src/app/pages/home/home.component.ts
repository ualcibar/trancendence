import { Component, OnInit } from '@angular/core';

import { ChatComponent } from '../../components/chat/chat.component';
import {LobbySearchComponent} from '../../components/lobby-search/lobby-search.component';
import { LobbyMatchComponent } from '../../components/lobby-match/lobby-match.component';
import { LobbyTournamentComponent } from '../../components/lobby-tournament/lobby-tournament.component';
import { TournamentMatchMenuComponent } from '../../components/tournament-match-menu/tournament-match-menu.component';

import { AuthService } from '../../services/auth.service';
import { GameSettings, GameType, MatchmakingService, MatchMakingState, OnlineMatchState} from '../../services/matchmaking.service';
import { CommonModule } from '@angular/common';

import { fadeInOut } from '../../../assets/animations/fadeInOut';
import { GameManagerService, MatchConfig, MatchSettings } from '../../services/game-config.service';
import { MapSettings, MapsService } from '../../services/map.service';
import { Router } from '@angular/router';
import { PaddleState } from '../pong/pong.component';
import { ChatService } from '../../services/chat.service';

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
  debug : boolean = false;
  chatUnwrapped: boolean = false;
  isAnimating: boolean = false;
  state: HomeState;
  HomeState = HomeState;
  OnlineMatchState = OnlineMatchState;
  MatchMakingState = MatchMakingState;

  constructor(public matchmakingService: MatchmakingService,
              public chatService: ChatService,
              private authService: AuthService,
              private gameManager : GameManagerService,
              private maps : MapsService,
              private router : Router) {
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
  refresh() {
    this.authService.refreshToken();
  }
  scapeKeyPressed() {
    console.log('escape');
    this.changeState(HomeState.Home);
  }

  new_match_tournament(newGame: any) {
    console.log('new match!!!!!!!!!!!!')
    const map = this.maps.getMapSettings(newGame.mapName);
    if (!map) {
      console.error('no such map');
      this.changeState(HomeState.Home);
      return
    }
    if (newGame.gameType === GameType.Match) {
      console.log('team size before', newGame.teamSize)
      this.gameManager.createMatch(new MatchConfig(
        new MatchSettings(newGame.teamSize, new Array<PaddleState>(newGame.teamSize * 2).fill(PaddleState.Binded)),
        map
      ));
      setTimeout(()=> this.gameManager.start(), 1000);
      console.log('match creted')
      this.router.navigate(['/play']);
      console.log('redirecting')
    }
  }

  ngOnDestroy() {
    this.matchmakingService.webSocket?.close();
  }
}

