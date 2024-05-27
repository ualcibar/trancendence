import { Component, OnInit } from '@angular/core';

import { ChatComponent } from '../../components/chat/chat.component';
import {LobbySearchComponent} from '../../components/lobby-search/lobby-search.component';
import { LobbyMatchComponent } from '../../components/lobby-match/lobby-match.component';
import { LobbyTournamentComponent } from '../../components/lobby-tournament/lobby-tournament.component';

import { AuthService } from '../../services/auth.service';
import { MatchmakingService, MatchMakingState, OnlineMatchState} from '../../services/matchmaking.service';
import { CommonModule } from '@angular/common';

import { fadeInOut, fadeInOuttimeout } from '../../../assets/animations/fadeInOut';
import { GameManagerService, MatchConfig, MatchSettings, TournamentManager, TournamentSettings} from '../../services/gameManager.service';
import { MapsName, MapsService } from '../../services/map.service';
import { Router } from '@angular/router';

import { ChatService } from '../../services/chat.service';
import { TournamentGeneratorComponent } from '../../components/tournament-gererator/tournament-generator-component';
import { MatchGeneratorComponent } from '../../components/match-generator/match-generator-component';
import { LogFilter, Logger } from '../../utils/debug';
import { ChatState, HomeState, MatchmakingState, StateService } from '../../services/stateService';
import { TournamentTreeComponent } from '../../components/tournament-tree/tournament-tree.component';
/*
enum HomeState {
  Home,
  Multiplayer,
  TournamentTree,
  Local,
  LocalTournament,
  LocalMatch
}*/

class LocalGameHandler{
  private matchSettings? : MatchSettings | undefined;
  private tournamentSettings? : TournamentSettings | undefined;

  defulatMatch() : MatchSettings{//this should be somewhere else
    return new MatchSettings(60,3,2,1,MapsName.Default);//!todo should be in settings
  }
  defulatTournament() : TournamentSettings{//this should be somewhere else
    return new TournamentSettings(this.defulatMatch(),10);//!todo should be in settings
  }

  getMatchSettings() : MatchSettings{
    if (!this.matchSettings){
      console.log('reseted match')
      this.matchSettings = this.defulatMatch();
    }
    return this.matchSettings;
  }
  getTournamentSettings() : TournamentSettings{
    if (!this.tournamentSettings)
      this.tournamentSettings = this.defulatTournament();//!todo should be in settings
    return this.tournamentSettings;
  }
  resetMatchSettings(){
    this.matchSettings = undefined;
  }
  resetTournamentSettings(){
    this.tournamentSettings = undefined;
  }
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ChatComponent,
    LobbySearchComponent,
    CommonModule,
    LobbyMatchComponent,
    LobbyTournamentComponent,
    TournamentGeneratorComponent,
    MatchGeneratorComponent,
    TournamentTreeComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  animations: [fadeInOut]
})
export class HomeComponent implements OnInit{
  debug : boolean = false;
  chatUnwrapped: boolean = false;
  isAnimating: boolean = false;
  //state: HomeState;

  //so that the html can access them, maybe they should be in import?
  HomeState = HomeState;
  OnlineMatchState = OnlineMatchState;
  MatchmakingState = MatchmakingState;
  ChatState = ChatState;

  localGameHandler : LocalGameHandler = new LocalGameHandler();
  tournamentManager? : TournamentManager;

  //logger
  logger : Logger = new Logger(LogFilter.HomeLogger, 'home:');

  constructor(public matchmakingService: MatchmakingService,
              public chatService: ChatService,
              public authService: AuthService,
              private gameManager : GameManagerService,
              private maps : MapsService,
              private router : Router,
              public state : StateService) {
                
  }

  ngOnInit(): void {
  }

  changeState(newState: HomeState): void {
    this.state.changeHomeState(newState)
    this.isAnimating = true;
    this.logger.info(this.isAnimating);
    // Espera un tiempo antes de marcar que la animación ha terminado
    setTimeout(() => {
      this.isAnimating = false;
    }, fadeInOuttimeout); // Ajusta este valor según la duración de tu animación
  }
  refresh() {
    this.authService.refreshToken();
  }
  scapeKeyPressed() {
    this.logger.info('escape');
    this.changeState(HomeState.Home);
  }

  backgroundClicked(){
    this.logger.info('backgroud clicked');
    const state = this.state.homeState;
    if (state === HomeState.MatchTournament || state === HomeState.SearchingOnlineGame)
      this.changeState(HomeState.Home)
    else if (state === HomeState.MatchGenerator || state === HomeState.TournamentGenerator)
      this.changeState(HomeState.MatchTournament)
  }

  getMatch() {
    return this.localGameHandler.getMatchSettings()
  }
  getTournament() {
    return this.localGameHandler.getTournamentSettings()
  }
  createMatch(){
    const matchSettings = this.localGameHandler.getMatchSettings();
    this.logger.info('new match', matchSettings);

    const mapSettings = this.maps.getMapSettings(matchSettings.mapName);
    if (!mapSettings){
      this.logger.error('create match: couldn\'t find map. //how the fuck did u do that');
      return
    }

    if (!this.gameManager.createMatch(new MatchConfig(matchSettings, mapSettings))){ 
      this.logger.error('create match: manager failed to create match');
      return
    }
    this.router.navigate(['/play']);
  }

  createTournament(){
    const tournamentSettings = this.localGameHandler.getTournamentSettings();
    this.logger.info('new match', tournamentSettings);

    const mapSettings = this.maps.getMapSettings(tournamentSettings.matchSettings.mapName);
    if (!mapSettings){
      this.logger.error('create match: couldn\'t find map. //how the fuck did u do that');
      return
    }

    this.tournamentManager = this.gameManager.createTournament(tournamentSettings, mapSettings)
    if (!this.tournamentManager){ 
      this.logger.error('create match: manager failed to create match');
      return
    }
    this.router.navigate(['/play']);
  }
}

