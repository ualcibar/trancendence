import { Injectable } from '@angular/core';
import {AuthService, PrivateUserInfo, UserInfo, UserInfoI} from './auth.service';
import { Router } from '@angular/router';
import { State } from '../utils/state';

import { ClientUpdate, GameManagerService, MatchSettings, MatchSettingsI, MatchState, MatchUpdate, OnlineMatchInfo, OnlineMatchManager } from './gameManager.service';
import { MapsName, MapsService } from './map.service';
import { toEnum } from '../utils/help_enum';
import { EventData, PongEventType } from '../utils/behaviour';
import { LogFilter, Logger } from '../utils/debug';
import { HomeState, MatchmakingState, StateService } from './stateService';
import {Observable, Subscription, interval, BehaviorSubject, Subject} from 'rxjs';
import { USE_DEFAULT_LANG } from '@ngx-translate/core';
import { Notification, NotificationService } from './notificationService';
import { data, map } from 'jquery';

import {ip} from '../../main'

export enum OnlineMatchState{
  Joining = 'Joining', 
  Connecting = 'Connecting',
  WaitingForPlayers = 'WaitingForPlayers',
  Starting = 'Starting',
  Running = 'Running',
  FinishedSuccess = 'FinishedSuccess',
  HostDisconected = 'HostDisconnected',
  GameCrash = 'GameCrash',
  FailedToJoin = 'FailedToJoin',
  FinishedError = 'FinishedError',
  Paused = 'Paused'
}
/*
export class MatchUpdate{
  paddles : Paddle[];
  balls : Ball[];
  blocks : Block[];
  id : number;
  constructor(paddles : Paddle[], balls : Ball[], blocks : Block[], id : number){
    this.paddles = paddles;
    this.balls = balls;
    this.blocks = blocks;
    this.id = id;
  }
  subscribeAllToManager(manager : Manager){
    this.balls.forEach(ball => ball.subscribeToManager(manager));
    this.paddles.forEach(paddle => paddle.subscribeToManager(manager));
    this.blocks.forEach(block => block.subscribeToManager(manager));
  }
  runTickBehaviour(delta : number){
    for (let i = 0; i < this.paddles.length; i++){
      this.paddles[i].tickBehaviour.runTick(delta);
    }
    for (let i = 0; i < this.balls.length; i++){
      this.balls[i].tickBehaviour.runTick(delta);
    }
    for (let i = 0; i < this.blocks.length; i++){
      this.blocks[i].tickBehaviour.runTick(delta);
    }
  }

  <button *ngIf="!friendService.friendExist()" class="btn mb-2 btn-warning btn-sm"><i class="bi bi-person-heart"></i></button>
  update(update : MatchUpdate){
    for (const [index, paddle] of this.paddles.entries()){
      paddle.pos.copy(update.paddles[index].pos);
      paddle.dimmensions.copy(update.paddles[index].dimmensions);
      paddle.type = update.paddles[index].type;
      paddle.color = update.paddles[index].color;
      paddle.dir.copy(update.paddles[index].dir);
      paddle.speed = update.paddles[index].speed;
    }
    for (const [index, ball] of this.balls.entries()){
      ball.pos.copy(update.balls[index].pos);
      ball.dir.copy(update.balls[index].dir);
      ball.speed = update.balls[index].speed;
      ball.lightColor = update.balls[index].lightColor;
      ball.lightIntensity = update.balls[index].lightIntensity;
      ball.lightOn = update.balls[index].lightOn;
    }
    for (const [index, block] of this.blocks.entries()){
      block.pos.copy(update.blocks[index].pos);
      block.dimmensions.copy(update.blocks[index].dimmensions);
      block.type = update.blocks[index].type;
      block.material = update.blocks[index].material;
      block.speed = update.blocks[index].speed;
    }
  }
}*/

export class Score{
  score : [number, number];
  constructor(score : [number, number]){
    this.score = [score[0], score[1]];
  }
  scoreA(points : number){
    this.score[0] += points;
  }
  scoreB(points : number){
    this.score[1] += points;
  }
  changeScore(newScore : [number, number]){
    this.score = newScore;
  }
}

export enum OnlinePlayerState{
  Joining = 'Joining',
  Connecting = 'Connection',
  Connected = 'Connected',
  Disconnected = 'Disconnected',
  Blocked = 'Blocked'
}

export interface OnlinePlayerI{
  state : string;
  username : string;
  id : number;
  avatarUrl : string;
}

export class OnlinePlayer{
  state : State<OnlinePlayerState>;
  username : string;
  id : number;
  avatarUrl : string;

  constructor(username : string, id : number,
              state : OnlinePlayerState = OnlinePlayerState.Connecting,
              avatarUrl : string
  ){
    this.state = new State<OnlinePlayerState>(state);
    this.username = username;
    this.id = id;
    this.avatarUrl = avatarUrl;
  }
  getState(): OnlinePlayerState{
    return this.state.getCurrentValue();
  }
  changeState(state : OnlinePlayerState){
    this.state.setValue(state);
  }
  static fromI(values : OnlinePlayerI) : OnlinePlayer | undefined{
    const state = toEnum(OnlinePlayerState, values.state);
    if (!state){
      console.error('online player: fromI: failed to parse state')
      return undefined
    }
    return new OnlinePlayer(values.username, values.id, state, values.avatarUrl)
  } 
}

export interface OnlineMatchSettings2I{
  name : string;
  publicMatch : boolean;
  matchSettings : MatchSettingsI;
  available : boolean;
}

export class OnlineMatchSettings2{
  name : string;
  publicMatch : boolean;
  matchSettings : MatchSettings; 
  available : boolean;
  
  constructor( name : string, publicMatch: boolean, 
               matchSettings : MatchSettings, available : boolean){
    this.name = name;
    this.publicMatch = publicMatch;
    this.matchSettings = matchSettings;
    this.matchSettings.isLocal = false;
    this.available = available;
  }
  static fromI(onlineMatchSettings2I : OnlineMatchSettings2I) : OnlineMatchSettings2 | undefined{
    const matchSettings = MatchSettings.fromI(onlineMatchSettings2I.matchSettings)
    if (!matchSettings)
      return undefined
    return new OnlineMatchSettings2(onlineMatchSettings2I.name, onlineMatchSettings2I.publicMatch, matchSettings, onlineMatchSettings2I.available)
  }
  static default() : OnlineMatchSettings2{
    return new OnlineMatchSettings2('default', true, MatchSettings.default(), true)
  }
}

export interface MatchSync{
  sendMatchUpdate(update : MatchUpdate) : void;
  sendClientMatchUpdate(update : ClientUpdate) : void;
  sendEvent(type : PongEventType, data : EventData): void;
  broadcastEvent(type : PongEventType, data : EventData): void;
  syncOnlineMatchState(state : OnlineMatchState) : void;
}

@Injectable({
  providedIn: 'root'
})
export class MatchmakingService implements MatchSync{
  //backend connection
  webSocketUrl = 'wss://' + ip + ':1501/ws/matchmaking/global/';
  webSocket: WebSocket | undefined;

  //state of the service
  //state : State<MatchMakingState> = new State<MatchMakingState>(MatchMakingState.Standby);
 
  //match connections
  maxCurrentPeerConnections : number = 0; 
  peerConnections : (Map<number,RTCPeerConnection> | RTCPeerConnection | undefined);
  dataChannels : (Map<number,RTCDataChannel> | RTCDataChannel | undefined);
 
  //info about the current matches available
//  entries : Map<GameType, GameSettings[]> = new Map<GameType, GameSettings[]>;
  availableMatches : OnlineMatchSettings2[] = [];
  //private dataChangedSubject: Subject<void> = new Subject<void>();
  //dataChanged$: Observable<void> = this.dataChangedSubject.asObservable();
  private dataChangedSubject : Subject<void> = new Subject();
  dataChanged : Observable<void> = this.dataChangedSubject.asObservable()

  //match manager
  private onlineManager? : OnlineMatchManager | undefined;

  canInvite : State<boolean> = new State<boolean>(true);

/*  connectionInterval : Subscription;*/
  //logger
  logger : Logger = new Logger(LogFilter.MatchmakingServiceLogger, 'matchmaking :')

  constructor(private authService : AuthService,
              private router : Router,
              private maps : MapsService,
              private gameManager : GameManagerService,
              private stateService : StateService,
              private notifications : NotificationService){
   // this.entries.set(GameType.Match, []);
   // this.entries.set(GameType.Tournament,[]);
    //this.connectToServer();
    this.authService.subscribe((loggedIn: PrivateUserInfo | undefined) => {
      if (loggedIn && this.isClosed()) {
        this.connectToServer();
      } else if (!loggedIn && this.isConnected()) {
        this.disconectFromWebsocket();
      }
    })

/*    this.connectionInterval = interval(1000)
      .subscribe(() => {
        if (this.authService.amIloggedIn && this.isClosed()) {
          this.connectToServer();
        }
      });*/
  }

  //GENERAL
  isConnected() : boolean{
    return this.webSocket !== undefined && this.webSocket.readyState === WebSocket.OPEN
  }
  isClosed() : boolean{
    return this.webSocket === undefined || this.webSocket.readyState === WebSocket.CLOSED;
  }

  disconectFromWebsocket() {
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = undefined;
      this.stateService.changeMultiplayerState(MatchmakingState.Disconnected)
    }
    
  }
	matchAvailable(matchName : string): boolean{
    return	this.availableMatches.some((match) => match.name === matchName && match.available)
	}

  getMatches() : OnlineMatchSettings2[]{
    return this.availableMatches;
  }

  newOnlineMatch(settings : OnlineMatchSettings2){
    if (this.isConnected()){
      const messageObject = { type: '/new_match', settings : settings }; 
      this.logger.info('settings json', JSON.stringify(messageObject))
      this.sendMessage(JSON.stringify(messageObject)); 
    }
  }

  reloadMatches(){
    if (this.isConnected()){
      let messageObject = {type : '/match_list'};
      this.sendMessage(JSON.stringify(messageObject));
    }
  }

  async joinMatch(matchName : string){
    this.logger.info('join match called');
    if (this.isConnected()){
      if (this.onlineManager){
        this.logger.error('join match: already in match');
        return;
      }
      let messageObject = {
        type: '/join/match',
        name: matchName,
      }
      this.sendMessage(JSON.stringify(messageObject))
    }else
      this.logger.error('join match: failled to join match called');
  }
  sendCancelJoinMatch() {
    const message = {type : '/match/cancel_join'};
    this.sendMessage(JSON.stringify(message));
  }
  sendCancelReconnectMatch() {
    const message = {type : '/match/cancel_reconnect_to_self'};
    this.sendMessage(JSON.stringify(message));
  }

  sendMessage(message : string): boolean {
    if (this.isConnected()) {
      this.webSocket!.send(message); 
      return true;
    } else {
      this.logger.error('WebSocket connection is not open');
      return false;
    }
  }

  getCurrentMatchState() : OnlineMatchState | undefined{
    if(!this.onlineManager){
      //console.error('get current match state: online manager is undefined');
      return undefined;
    }
    return this.onlineManager.getOnlineState();
  }
  setCurrentMatchState(state : OnlineMatchState){
    if (this.onlineManager === undefined){
      this.logger.error('current game state is not initialized');
      return;
    }
    this.onlineManager.setOnlineMatchState(state);
    this.onlineManager.setMatchState(MatchState.Running);
  }

  connectToServer() {
    if (this.isConnected()) {
      return;
    }
    const jwtToken = this.authService.getCookie('access_token');
    if (!jwtToken) {
      this.logger.info('failed to get cookie access token, log in');
      return;
    }
    this.webSocket = new WebSocket(`${this.webSocketUrl}?token=${jwtToken}`);
    this.webSocket.onopen = () => {
      this.stateService.changeMultiplayerState(MatchmakingState.StandBy);
      this.logger.info('WebSocket connection opened');
      //this.reloadMatches();
      // this.sendMessage(JSON.stringify({type : '/getStatus'}));
    };
    this.webSocket.onerror = () => {
      this.logger.error('error on websocket')
    }
    this.webSocket.onclose = () => {
      this.stateService.changeMultiplayerState(MatchmakingState.Disconnected);
      this.logger.info('websocket closed')
    };
    this.webSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.logger.info('message of type ', data.type, ' received.')
      switch (data.type) {
        case 'status':
          switch (data.status) {
            case 'Connected':
              this.stateService.changeMultiplayerState(MatchmakingState.StandBy)
              break;
            case 'JoiningGame':
              this.stateService.changeMultiplayerState(MatchmakingState.InGame)
              break;
            case 'InGame':
              this.stateService.changeMultiplayerState(MatchmakingState.InGame);
              break;
            default:
              this.logger.error(`unknown status : ${data.status}`);
          }
          break;
        case 'new_match':
          this.logger.info(data.match)
          const match = OnlineMatchSettings2.fromI(data.match)
          if (!match){
            this.logger.error('failed to parse new match')
            return
          }
          this.availableMatches.push(match);
          this.dataChangedSubject.next()
          break;
        case 'del_match':
          for (const [index, match] of this.availableMatches.entries()) {
            if (match.name === data.del_match_name) {
              this.availableMatches.splice(index);
              this.dataChangedSubject.next()
              return;
            }
          }
          break;
        case 'new_match_result':
          if (this.authService.userInfo === undefined) {
            this.logger.error('new match result:  withouht being logged in');
            this.stateService.changeMultiplayerState(MatchmakingState.StandBy);
            return;
          }
          switch (data.status) {
            case 'success':
              this.logger.info('match info', data.match)
              const info = OnlineMatchInfo.fromI(data.match);
              if (!info){
                this.logger.error('failed to parse online match info');
                this.stateService.changeMultiplayerState(MatchmakingState.StandBy);
                return;
              }
              const mapSettings = this.maps.getMapSettings(info.onlineSettings.matchSettings.mapName)
              if (!mapSettings) {
                this.logger.error('failed to create map settings');
                this.stateService.changeMultiplayerState(MatchmakingState.StandBy);
                return;
              }
              const manager = this.gameManager.createOnlineMatch(info, mapSettings, true, this, OnlineMatchState.WaitingForPlayers, this.authService.userInfo.info.id);
              if (!manager) {
                this.logger.error('failed to start online manager');
                this.stateService.changeMultiplayerState(MatchmakingState.StandBy);
                return;
              }
              this.onlineManager = manager;
              this.maxCurrentPeerConnections = 2;//info needs to be somewhere else
              this.dataChannels = new Map();
              this.peerConnections = new Map();
              this.stateService.changeMultiplayerState(MatchmakingState.InGame);
              this.stateService.changeHomeState(HomeState.JoiningGame)
              this.logger.info("successfully created match");
              break;
            case 'failure_already_host':
              this.logger.error('failed to create match, already in a match');
              break;
            case 'failure_already_in_another_game':
              this.logger.error('failed to create match, already in a match');
              break;
            case 'failure_duplicate_key':
              this.logger.error('match name already in use');
              this.stateService.changeMultiplayerState(MatchmakingState.StandBy);
              break;
            case 'failure':
              this.logger.error('failed to create match, try again');
              this.stateService.changeMultiplayerState(MatchmakingState.StandBy);
              break;
            default:
              this.logger.error(`unknown error status: ${data.status}`);
              this.stateService.changeMultiplayerState(MatchmakingState.StandBy);
          }
          break;
        case 'join_match_result':
          switch (data.status) {
            case 'failure_already_in_another_game':
              this.logger.error('failed to join lobby, already in another game');
              this.stateService.changeMultiplayerState(MatchmakingState.StandBy);
              break;
            case 'failure':
              this.logger.error('failed to join lobby');
              this.stateService.changeMultiplayerState(MatchmakingState.StandBy);
              break;
            case 'success':
              const info = OnlineMatchInfo.fromI(data.match);
              if (!info){
                this.sendCancelJoinMatch()
                this.logger.error('join match: success: failed to parse online match info');
                this.stateService.changeMultiplayerState(MatchmakingState.StandBy);
                return;
              }
              const mapSettings = this.maps.getMapSettings(info.onlineSettings.matchSettings.mapName)
              if (!mapSettings) {
                this.sendCancelJoinMatch()
                this.logger.error('join match: success: failed to create map settings');
                this.stateService.changeMultiplayerState(MatchmakingState.StandBy);
                return;
              }
              const manager = this.gameManager.createOnlineMatch(info, mapSettings, false, this, OnlineMatchState.Connecting, this.authService.userInfo!.info.id);
              this.maxCurrentPeerConnections = data.match.max_players - 1;
              if (!manager) {
                this.sendCancelJoinMatch()
                this.logger.error('joined match result success switch: failed to create online match');
                //!todo should tell the game that it disconnected or something
                return;
              }
              this.onlineManager = manager;
              this.stateService.changeMultiplayerState(MatchmakingState.InGame);
              this.logger.info('successfully joined game group, waiting for webrtc');
              break;
            default:
              this.logger.error(`cant find status ${data.status}`);
              this.stateService.changeMultiplayerState(MatchmakingState.StandBy);
          }
          break;
        case 'player_joined_match':
          if (!this.onlineManager) {
            this.logger.error('player joined match: online manager is undefined')
            return;
          }
          if (!this.onlineManager.amIHost)
            this.onlineManager.addPlayer(data.player.username, data.player.id, data.index, data.player.avatarUrl);
          break;
        case 'player_left_match':
          if (!this.onlineManager) {
            this.logger.error('player left match: online manager is undefined')
            return;
          }
          this.logger.error('!todo')
          break;
        case 'player_joined_match_to_host':
          this.logger.info('player joined match to host')
          if (!(this.peerConnections instanceof Map) || !(this.dataChannels instanceof Map)) {
            this.logger.error('webrtc answer switch: peerconnection or datachannels is not map');
            return;
          }
          if (this.onlineManager === undefined) {
            this.logger.error('received a player joined match while not in a game');
            return
          }
          this.onlineManager.addPlayer(data.username, data.senderId, data.index, data.avatarUrl);
          const peerConnection = this.webrtcCreatePeerConnection(data.senderId, false)!;//we dont care because we already checked for online manager
          this.peerConnections.set(data.senderId, peerConnection);
          const dataChannel = peerConnection.createDataChannel(data.sender);
          this.webrtcSetDataChannel(dataChannel);
          this.dataChannels.set(data.senderId, dataChannel);
          peerConnection.createOffer().then(offer => {
            peerConnection.setLocalDescription(offer).then(() => {
              const message = {
                type: '/webrtc/offer',
                targetId: data.senderId,
                target: data.username,
                offer: offer,
              }
              this.sendMessage(JSON.stringify(message));
            });
          });
          break;
        case 'webrtc_offer':
          this.webrtcCreateAnswer(data.offer);
          break;
        case 'webrtc_answer':
          this.webrtcHandleAnswer(data);
          break;
        case 'webrtc_candidate':
          this.logger.info(`candidate received from ${data.sender}`);
          this.webrtcCandidate(data);
          break;
        case 'confirm_join_match_result':
          if (this.authService.userInfo === undefined) {
            this.logger.error('confirm join match result:  withouht being logged in');
            this.stateService.changeMultiplayerState(MatchmakingState.StandBy);
            return;
          }
          if (this.onlineManager === undefined) {
            this.logger.error('confirm join match result switch: currentMatchInfo undefined');
            return
          }
          if (!this.onlineManager.playerConnected(data.playerId)) {
            this.logger.error('confirm join match result switch: playerId doesn\'t match any current player');
            return;
          }
          if (data.player === this.authService.userInfo.info.username) {
            this.setCurrentMatchState(OnlineMatchState.WaitingForPlayers); 
            this.stateService.changeHomeState(HomeState.JoiningGame)
          }
          if (this.onlineManager.amIHost) {
            this.logger.info('all players may be connected checking...', this.onlineManager.info)
            if (this.onlineManager.areAllPlayersConnected()) {
              const message = { type: '/match/all_players_connected' };
              this.sendMessage(JSON.stringify(message));
            }
          }
          break;
        case 'match_confirm_reconnect':
          this.logger.info('confirm reconnect')
          if (!this.onlineManager) {
            this.logger.error('match confirm reconnect: online manager is undefined')
            return
          }
          if (!this.onlineManager.amIHost) {
            if (!this.authService.userInfo) {
              const subscribtion = this.authService.subscribe((userInfo: PrivateUserInfo | undefined) => {
                if (userInfo) {
                  if (userInfo.info.id == data.playerId) {
                    setTimeout(() => {
                      this.stateService.changeMultiplayerState(MatchmakingState.InGame)
                      this.gameManager.start();
                    }, 1000);
                    this.router.navigate(['/play']);
                  } else {
                    this.onlineManager!.playerReconnected(data.playerId)
                  }
                  subscribtion.unsubscribe()
                }
              })
            } else {
              this.onlineManager!.playerReconnected(data.playerId)
              if (this.authService.userInfo.info.id == data.playerId) {
                setTimeout(() => {
                  this.stateService.changeMultiplayerState(MatchmakingState.InGame)
                  this.gameManager.start();
                }, 1000);
                this.router.navigate(['/play']);
              }
            }
          }
          break;
        case 'match_all_players_connected':
          setTimeout(() => {
            this.stateService.changeMultiplayerState(MatchmakingState.InGame)
            //this.onlineManager!.onlineMatchState.setValue(OnlineMatchState.Running)
            this.gameManager.start();
          }, 1000);
          this.router.navigate(['/play']);
          break;
        case 'match_player_left':
          if (!this.onlineManager) {
            this.logger.error('match player left: online manager is undefined')
            return;
          }
          this.onlineManager.playerDisconnected(data.player_id);
          if (this.onlineManager.amIHost) {
            if (!(this.dataChannels instanceof Map && this.peerConnections instanceof Map)) {
              this.logger.error('data channels must be map if host')
              return;
            }
            const dataChannel = this.dataChannels.get(data.player_id)
            const peerConnection = this.peerConnections.get(data.player_id)
            if (!dataChannel) {
              //!todo datachannel
              this.logger.info('player datachannel may not have been stablished yet')
              return;
            }
            if (!peerConnection) {
              //!todo datachannel
              this.logger.info('player datachannel may not have been stablished yet')
              return;
            }
            dataChannel.close();
            peerConnection.close()
            this.peerConnections.delete(data.player_id)
            this.dataChannels.delete(data.player_id)
          }
          break;
        case 'match_player_reconnected':
          if (!this.onlineManager) {
            this.logger.error('player reconnected: online manager in undefined')
            const message = { type: '/match/cancel_reconnect', user_id: data.player_id }
            this.sendMessage(JSON.stringify(message))
            return
          }
          if (!this.onlineManager.amIHost) {
            this.logger.error('player reconnected: only host can reconnect a user')
            const message = { type: '/match/cancel_reconnect', user_id: data.player_id }
            this.sendMessage(JSON.stringify(message))
            return;
          }
          if (this.onlineManager.matchState.getCurrentValue() != MatchState.FinishedSuccess
            && this.onlineManager.matchState.getCurrentValue() != MatchState.FinishedError) {
            if (!(this.peerConnections instanceof Map) || !(this.dataChannels instanceof Map)) {
              this.logger.error('player reconnect: peerconnection or datachannels is not map');
              const message = { type: '/match/cancel_reconnect', user_id: data.player_id }
              this.sendMessage(JSON.stringify(message))
              return;
            }
            const peerConnection = this.webrtcCreatePeerConnection(data.player_id, true)!;//we dont care because we already checked for online manager
            this.peerConnections.set(data.player_id, peerConnection);
            const dataChannel = peerConnection.createDataChannel(data.player);
            this.webrtcSetDataChannel(dataChannel);
            this.dataChannels.set(data.senderId, dataChannel);
            peerConnection.createOffer().then(offer => {
              peerConnection.setLocalDescription(offer).then(() => {
                const message = {
                  type: '/webrtc/offer',
                  targetId: data.player_id,
                  target: data.player,
                  offer: offer,
                }
                this.sendMessage(JSON.stringify(message));
              });
            });
          }
          //this.onlineManager.playerReconnected(data.player_id)
          break;
        case 'match_reconnect':
          const info = OnlineMatchInfo.fromI(data.match)
          if (!info){
            this.sendCancelReconnectMatch()
            this.logger.error('match reconnect: failed to parse online match info');
            return;
          }
          const mapSettings = this.maps.getMapSettings(info.onlineSettings.matchSettings.mapName)
          if (!mapSettings){
            this.sendCancelReconnectMatch()
            this.logger.error('match reconnect: failed to get map settings');
            return;
          }
          const manager = this.gameManager.createOnlineMatch(info, mapSettings, false, this, OnlineMatchState.Connecting, this.authService.userInfo!.info.id);
          this.maxCurrentPeerConnections = data.match.max_players - 1;
          if (!manager) {
            this.sendCancelReconnectMatch()
            this.logger.error('match reconnect: joined match result success switch: failed to create online match');
            //!todo should tell the game that it disconnected or something
            return;
          }
          this.onlineManager = manager;
          this.stateService.changeMultiplayerState(MatchmakingState.InGame);
          this.logger.info('match reconnect: successfully reconnected, waiting for webrtc');
          break;
        case 'match_list':
          const matches : OnlineMatchSettings2[] = []
          for (const matchI of data.matches){
            const match = OnlineMatchSettings2.fromI(matchI)
            if (!match){
              this.logger.error('failed to parse match')
              continue;
            }
            matches.push(match)
          }
          this.availableMatches = matches
          this.dataChangedSubject.next()
          this.logger.info('available matches', this.availableMatches)
          break;
        case 'match_unavailable':
          this.availableMatches = this.availableMatches.filter(match => match.name !== data.match_name)
          this.dataChangedSubject.next()
          break;
        case 'match_finished':
          this.logger.info('match finished received')
          if (!this.onlineManager!.amIHost) {
            const message = { type: '/clear_user' }
            this.sendMessage(JSON.stringify(message));
          }
          if (data.score)
            this.onlineManager!.finishMatch(data.status, data.result, new Score([data.score[0], data.score[1]]));
          else
            this.onlineManager!.finishMatch(data.status, data.result, undefined);
          //copy a
          this.stateService.changeMultiplayerState(MatchmakingState.StandBy)
          this.setCurrentMatchState(OnlineMatchState.FinishedError)
          this.onlineManager = undefined
          this.gameManager.hardEnd()
          this.clearConnections()
          break;
        case 'match_host_left_joining':
          const message = {type : '/clear_user'}
          this.sendMessage(JSON.stringify(message))

          //copy b
          const notification = new Notification('Matchmaking', 'host left the match')
          this.stateService.changeHomeState(HomeState.Home)
          this.stateService.changeMultiplayerState(MatchmakingState.StandBy)
          this.setCurrentMatchState(OnlineMatchState.FinishedError)
          this.notifications.addNotification(notification);
          this.onlineManager = undefined
          this.gameManager.hardEnd()
          this.clearConnections()
          break;
        default:
          this.logger.error(`unknown case received: ${data.type}`);
      }
    }
  }

  clearConnections(){
    if (this.dataChannels instanceof Map){
      this.dataChannels.forEach(datachannel => datachannel.close())
    }else{
      this.dataChannels?.close()
    }
    if (this.peerConnections instanceof Map){
      this.peerConnections.forEach(peerConnection => peerConnection.close())
    }else
      this.peerConnections?.close()
  }

  getMatchUpdate() : MatchUpdate | undefined{
    return this.onlineManager?.getMatchUpdate();
  }

  //WEBRTC

  webrtcCreatePeerConnection(playerId: number | undefined = undefined, reconnected : boolean) : RTCPeerConnection | undefined{
    if (this.onlineManager === undefined)
      return;
    const pc_config = {
      iceServers: [
        {
          urls: "stun:stun.1.google.com:19302",
        },
      ],
    };
    const peerConnection = new RTCPeerConnection(pc_config);
    peerConnection.onicecandidate = event => {
      if (event.candidate){
        if (!this.onlineManager){
          this.logger.error('on ice candidate: online manager is not set');
          return;  
        }
        this.onlineManager.subscribeOnlineMatchState((state : OnlineMatchState) => {
            this.logger.info('ice candidate: current game state', state);
            if (state !== OnlineMatchState.FinishedError && state !== OnlineMatchState.FinishedSuccess && state !== OnlineMatchState.FailedToJoin) {
              this.logger.info("Sending ice candidate to peer", event.candidate);
              const message = { type: '/webrtc/candidate', candidate: event.candidate };
              this.sendMessage(JSON.stringify(message));
            }
        })
      }
    }
    peerConnection.oniceconnectionstatechange = event => {
      this.logger.info("ICE connection state: ", peerConnection.iceConnectionState, '\nReconnect?', reconnected);
      if (peerConnection.iceConnectionState === 'connected'){
        if (!this.onlineManager){
          this.logger.error('player connected without online manager being set');
          return
        }
        if (this.onlineManager.amIHost){
          this.logger.info('am i host?', this.onlineManager.amIHost)
          if (playerId === undefined){
            this.logger.error('on iceconnection state change: while being host player id must be set')
            return;
          }
          if (reconnected === false) {
            const player = this.onlineManager.playerConnected(playerId)
            if (!player) {
              this.logger.error('on ice connection state change: player wasnt set');
              return;
            }
            const message = { type: '/confirm_join/match', player: player.username, playerId: player.id };
            this.logger.info('confirming new player connection has been stablished');
            this.sendMessage(JSON.stringify(message));
          }else{
            const player = this.onlineManager.playerReconnected(playerId);
            if (player) {
              const message = { type: '/match/confirm_reconnect', player: player.username, playerId: player.id };
              this.logger.info('confirming new player reconnection has been stablished');
              this.sendMessage(JSON.stringify(message));
            }else{
              this.logger.error('webrtc ice candidate state change: coulnd\t reconnect player')
              const message = { type: '/match/cancel_reconnect', user_id: playerId }
              this.sendMessage(JSON.stringify(message))
            }
          }

        }
      }
    }
    peerConnection.ontrack = event => {
      this.logger.info("received remote track:", event.track);
    }
    if (playerId === undefined){
      peerConnection.ondatachannel = event => {
        this.dataChannels = event.channel;
        this.webrtcSetDataChannel(this.dataChannels);
      };
    }
    return peerConnection;
  }
  webrtcSetDataChannel(dataChannel : RTCDataChannel){
    dataChannel.onopen = () => {
      this.logger.info('Data channel opened');
    };
    dataChannel.onmessage = (event => {
      if (this.onlineManager === undefined)
        return;
      const message = JSON.parse(event.data);
      if (message.type === 'update')
        this.onlineManager.matchUpdate.update(message.data);
      else if (message.type === 'client_update'){
        const update : ClientUpdate = message.data
        //console.log('client update')
        //console.log(update)
        this.onlineManager.matchUpdate.clientUpdate(message.data);
      }
      else if (message.type === 'event'){
        this.logger.info('event received !!!', message)
        if (!this.onlineManager){
          this.logger.error('datachannel on message: pong event: online manager is undefinde')
          return;
        }
        if (message.method === 'broadcast')
          this.onlineManager.broadcastRemoteEvent(message.eventType, message.data);  
        else if (message.method === 'send')
          this.onlineManager.sendRemoteEvent(message.eventType, message.data);
        else
          this.logger.error('datachannel on message: event: no such method', message.method)
      }
    });
    dataChannel.onclose = () => {
      this.logger.info('Data channel closed');
    };

    // Event handler for errors
    dataChannel.onerror = (error) => {
      this.logger.error('Data channel error:', error);
    };
  }
  webrtcCandidate(data: any) {
    if (data.sender !== this.authService.userInfo?.info.username) {
      this.logger.info('adding ice candidate')
      if (this.peerConnections instanceof Map) {
        const peerConnection = this.peerConnections.get(data.senderId);
        if (!peerConnection){
          this.logger.error('webrtc candidate: target id not recognised');
          return;
        }else{
          peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      }else if (this.peerConnections instanceof RTCPeerConnection){
        this.peerConnections.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    }
  }
  broadcastWebrtc(message : string){
    if (this.dataChannels === undefined){
      this.logger.error('broadcast webrtc: current game is undefined');
      return;
    }
    if (this.onlineManager === undefined){
      this.logger.error('broadcast webrtc: online manager not set')
      return; 
    }
    if (!this.onlineManager.amIHost){
      this.logger.error('broadcast webrtc: only host cand send a full update')
      return;
    }
    if (this.dataChannels instanceof RTCDataChannel){
      this.logger.error('broadcast webrt: data channels must be intance of map')
      return;
    }
    for (const chann of this.dataChannels.values()){
      if (chann.readyState === 'open')
        chann.send(message);
    } 
  }

  webrtcHandleAnswer(data : any){
    if (this.onlineManager === undefined){
      this.logger.error('webrtc handle answer: online manager not set')
      return; 
    }
    if (!this.onlineManager.amIHost){
      this.logger.error('webrtc handle answer: only host can handle answer')
      return;
    }
    if (this.peerConnections === undefined || this.peerConnections instanceof RTCPeerConnection){
      this.logger.error('webrtc handle answer: peerconnections is not instance of RTCPeerConnection');
      return;
    }
    const peerConnection = this.peerConnections.get(data.targetId);
    if (!peerConnection){
      this.logger.error('webrtc handle answer: cannot find target id in map');
      return;
    }
    peerConnection.setRemoteDescription(data.answer)
      .then(() => {
        if (peerConnection.signalingState && peerConnection.localDescription && peerConnection.remoteDescription) {
          this.logger.info("remote and local description set successfully");
          this.logger.info('current game state', this.getCurrentMatchState());
        }
      })
      .catch(error => {
        this.logger.error("Error setting remote description", error);
      });
  }

  async webrtcCreateAnswer(offer: RTCSessionDescription){
    if (this.onlineManager === undefined){
      this.logger.error('webrtc create answer: online manager not set')
      return; 
    }
    if (this.onlineManager.amIHost){
      this.logger.error('webrtc create answer: only client can send answer, state is currently host');
      return;
    }
    this.peerConnections = this.webrtcCreatePeerConnection(undefined, false);
    if (!this.peerConnections){
      this.logger.error('webrtc create answer: peer connection not created');
      return;
    }
    await this.peerConnections.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnections.createAnswer();
    this.peerConnections.setLocalDescription(answer)
      .then(() => {
        if (this.peerConnections === undefined || this.peerConnections instanceof Map) {
          this.logger.error('webrtc create answer: peerConnetions is not instance of RTCPeerconnnection');
          return;
        }
        if (this.peerConnections.signalingState && this.peerConnections.localDescription && this.peerConnections.remoteDescription)
          this.logger.info("remote and local description set successfully");
        else
          this.logger.error("webrtc create answer: remote and local not set");
      })
      .catch(error => {
        this.logger.error("webrtc create answer: Error setting remote description", error);
      });
    const message = JSON.stringify({ type: '/webrtc/answer', answer: answer });
    this.logger.info('send message : ', { type: '/webrtc/answer', answer: answer })
    this.sendMessage(message);
  }


  //MATCH SYNC

  sendMatchUpdate(update : MatchUpdate) : void {
    if (this.dataChannels === undefined){
      this.logger.error('send match update: current game is undefined');
      return;
    }
    if (this.onlineManager === undefined){
      this.logger.error('send match update: online manager not set')
      return; 
    }
    if (!this.onlineManager.amIHost){
      this.logger.error('send match update: only host cand send a full update')
      return;
    }
    if (this.dataChannels instanceof RTCDataChannel){
      this.logger.error('send match update: data channels must be intance of map')
      return;
    }
    const message = JSON.stringify({
      type : 'update',
      data : update,
    });
    for (const chann of this.dataChannels.values()){
    if (chann.readyState === 'open')
      chann.send(message);
    }
  }
  sendClientMatchUpdate(update : ClientUpdate) : void {
    if (this.dataChannels === undefined){
      this.logger.error('send match update: current game is undefined');
      return;
    }
    if (this.onlineManager === undefined){
      this.logger.error('send match update: online manager not set')
      return; 
    }
    if (this.onlineManager.amIHost){
      this.logger.error('send match update: only clients can send a client update')
      return;
    }
    if (this.dataChannels instanceof Map){
      this.logger.error('send match update: data channels must not be map')
      return;
    }
    const message = JSON.stringify({
      type : 'client_update',
      data : update,
    });
    
    if (this.dataChannels.readyState === 'open')
      this.dataChannels.send(message);
  }


  sendEvent(type: PongEventType, data: EventData): void {
    if (!this.onlineManager){
      this.logger.error('send event: online manager not set')
      return;
    }
    const message = {
      type : 'event',
      event : 'pongEvent',
      method : 'send',
      eventType : type,
      data : data
    };//!todo, data must be converted to sendable data. so that
      //object references are turned to ids, that will be turned
      //back to their corresponding ids in the receiver
    this.broadcastWebrtc(JSON.stringify(message));
  }
  broadcastEvent(type: PongEventType, data: EventData): void {
    if (!this.onlineManager){
      this.logger.error('send event: online manager not set')
      return;
    }
    const message = {
      type : 'event',
      method : 'broadcast',
      eventType : type,
      data : data
    };//!todo, data must be converted to sendable data. so that
      //object references are turned to ids, that will be turned
      //back to their corresponding ids in the receiver
    this.logger.info('broadcasting event to others', message)
    this.broadcastWebrtc(JSON.stringify(message));
  }
  getOnlineMatchSettings() : OnlineMatchSettings2 | undefined{
    return this.onlineManager?.getOnlineMatchSettings();
  }
  getOnlineMatchInfo() : OnlineMatchInfo | undefined{
    return this.onlineManager?.info;
  }

  syncOnlineMatchState(state: OnlineMatchState): void {
    if (this.onlineManager!.amIHost){
      this.onlineManager!.onlineMatchState.setValue(state);
      if (state === OnlineMatchState.FinishedSuccess ){
        const message = {type : '/match/end', state : state, score : this.onlineManager!.matchUpdate.score.score};
        this.sendMessage(JSON.stringify(message));
      }else if (state === OnlineMatchState.HostDisconected){
        const message = {type : '/match/host_left'};
        this.sendMessage(JSON.stringify(message));
      }
    }else{
      this.logger.error('only host can change online match state')
    }
  }
  endMatch(state: OnlineMatchState): void {
    
  }
}
