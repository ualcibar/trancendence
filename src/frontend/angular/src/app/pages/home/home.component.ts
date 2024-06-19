import {AfterViewInit, Component, OnInit} from '@angular/core';

import { ChatComponent } from '../../components/chat/chat.component';
import { LobbySearchComponent } from '../../components/lobby-search/lobby-search.component';
import { LobbyMatchComponent } from '../../components/lobby-match/lobby-match.component';

import { AuthService } from '../../services/auth.service';
import { MatchmakingService, OnlineMatchSettings2, OnlineMatchState} from '../../services/matchmaking.service';
import { CommonModule, NgOptimizedImage } from '@angular/common';

import { fadeInOut, fadeInOuttimeout } from '../../../assets/animations/fadeInOut';
import { GameManagerService, MatchConfig, MatchSettings, TournamentManager, TournamentSettings} from '../../services/gameManager.service';
import { MapsService } from '../../services/map.service';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';

import { ChatService } from '../../services/chat.service';
import { TournamentGeneratorComponent } from '../../components/tournament-gererator/tournament-generator-component';
import { MatchGeneratorComponent } from '../../components/match-generator/match-generator-component';
import { LogFilter, Logger } from '../../utils/debug';
import { ChatState, HomeState, MatchmakingState, StateService } from '../../services/stateService';
import { TournamentTreeComponent } from '../../components/tournament-tree/tournament-tree.component';
import { OnlineMatchGeneratorComponent } from '../../components/online-match-generator/online-match-generator-component';
import {TranslateModule} from "@ngx-translate/core";
import { easeOut } from '../../../assets/animations/easeOut';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ip } from '../../../main';
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
  private onlineMatchSettings? : OnlineMatchSettings2 | undefined;

  getMatchSettings() : MatchSettings{
    if (!this.matchSettings){
      console.log('reseted match')
      this.matchSettings = MatchSettings.default();
    }
    return this.matchSettings;
  }

  getTournamentSettings() : TournamentSettings{
    if (!this.tournamentSettings)
      this.tournamentSettings = TournamentSettings.default();//!todo should be in settings
    return this.tournamentSettings;
  }
  getOnlineMatchSettings() : OnlineMatchSettings2{
    if (!this.onlineMatchSettings)
      this.onlineMatchSettings = OnlineMatchSettings2.default();//!todo should be in settings
    return this.onlineMatchSettings;
  }
  resetMatchSettings(){
    this.matchSettings = undefined;
  }
  resetOnlineMatchSettings(){
    this.onlineMatchSettings = undefined;
  }
  resetTournamentSettings(){
    this.tournamentSettings = undefined;
  }
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgOptimizedImage,
    ChatComponent,
    LobbySearchComponent,
    CommonModule,
    LobbyMatchComponent,
    TournamentGeneratorComponent,
    MatchGeneratorComponent,
    TournamentTreeComponent,
    OnlineMatchGeneratorComponent, RouterLink, TranslateModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  animations: [fadeInOut, easeOut]
})

export class HomeComponent implements OnInit, AfterViewInit{
  debug : boolean = false; //Al activar el modo debug, aparecerá un recuadro en la página
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
              public state : StateService,
              private route : ActivatedRoute,
              private http : HttpClient) { 
  }

  ngOnInit(): void {
    //setTimeout(() => {
     // this.changeState(HomeState.MatchTournament);
    //}, 1200);
  }

  ngAfterViewInit(): void {
    this.route.queryParams.subscribe(params => {
      const code = params['code']; // Extract authorization code from query parameters
      // Now you can use the authorization code to obtain an access token
      const state = params['state'];
      if (code && state) {
        // Handle the authorization code

        const jsonToSend = {
          code: code
        };

        console.log('Authorization code:', code);
        if (state == 'login') {
          const httpOptions = {
            headers: new HttpHeaders({
              'Content-Type': 'application/json'
            }),
            withCredentials: true
          };
          const backendURL = `https://${ip}:1501/api/polls/login42/`;

          this.http.post<any>(backendURL, jsonToSend, httpOptions).subscribe({
            next : (response) => { 
              window.location.href = '/';
              console.log('Sent data: ', response);
            },
            error : (error) => {
              console.error('failed to login using 43', error);
            }
        });

        } else if (state == 'register') {
          const httpOptions = {
            headers: new HttpHeaders({
              'Content-Type': 'application/json'
            })
          };
          const backendURL = `https://${ip}:1501/api/polls/register42/`;

          this.http.post<any>(backendURL, jsonToSend, httpOptions).subscribe(
            response => {
              console.log('Sent data: ', response);
            },
            error => {
              console.error('failed to register using 43', error);
            }
          );

        } else {
          console.log('State must be register or login');
        }
        // Proceed with token exchange or authentication process
      } else {
        // Handle the absence of authorization code
        console.log('Authorization code or state not found');
        // Handle error or redirect to an error page
      }
    });
  }
/*  ngOnDestroy(): void {
    this.matchmakingService.webSocket.close();
  }*/

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
    if (state === HomeState.MatchTournament)
      this.changeState(HomeState.Home)
    else if (state === HomeState.MatchGenerator || state === HomeState.TournamentGenerator)
      this.changeState(HomeState.MatchTournament)
    else if (state === HomeState.OnlineMatchGenerator)
      this.changeState(HomeState.SearchingOnlineGame)
    else if (state === HomeState.SearchingOnlineGame)
      this.changeState(HomeState.Home)
  }

  getMatch() {
    return this.localGameHandler.getMatchSettings()
  }
  getOnlineMatch() {
    return this.localGameHandler.getOnlineMatchSettings()
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
  
  createOnlineMatch(){
    this.matchmakingService.newOnlineMatch(this.localGameHandler.getOnlineMatchSettings());
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

