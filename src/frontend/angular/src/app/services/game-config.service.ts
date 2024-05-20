import { Injectable } from '@angular/core';
import {  MatchInfo, MatchUpdate, OnlineMatchState, OnlinePlayer, OnlinePlayerState} from './matchmaking.service';

import { State } from '../utils/state';
import { Score } from './matchmaking.service';
import { Subscription } from 'rxjs';

import { PongEventType, EventObject, EventData } from '../utils/behaviour';
import { EventMap } from '../utils/eventMap';
import { UserInfo } from './auth.service';
import { MapSettings } from './map.service';
export enum GameConfigState{
  Standby = 'standby',
  StartingGame = 'starting game',
  Ingame = 'in game'
}

export enum TournamentState{
  Standby  = 'standby',
  Starting = 'starting',
  Running = 'running',
  FinishedSuccess = 'finished success',
  Error = 'error',
}

export enum MatchState{
  Starting = 'starting',
  Initialized = 'initialized',
  Running = 'running',
  Paused = 'paused',
  FinishedSuccess = 'finished success',
  Error = 'error',
}
/*
export class Tournament{
  private scores : [number,number][] = [];
  private winners : number[] = [];
  private teamSize : number;
  private numberOfPlayers : number;
  private state : State<TournamentState>;
  private currentLayer : number = -1;
  private currentMatchState : State<[Score, MatchState]> | undefined;
  private currentMatchSubscription : Subscription;
  constructor (teamSize : number, numberOfPlayers : number){
    this.teamSize = teamSize;
    this.numberOfPlayers = numberOfPlayers;
    this.state = new State<TournamentState>(TournamentState.Starting)
  }
  startTournament(){
    if (this.state.getCurrentValue() != TournamentState.Standby){
      console.error('start tournament: cant start tournament before finishing previous one');
      return;
    }
    this.state.setValue(TournamentState.Starting);
    this.state.setValue(TournamentState.Starting);
    this.currentLayer = 0;
    this.currentMatchState = new State<[Score, MatchState]>([new Score([0,0]), MatchState.Starting]);
    this.currentMatchSubscription = this.currentMatchState.observable.subscribe(
      ([score, state]: [Score, MatchState]) => {
        switch (state) {
          case MatchState.Starting:
            break;
          case MatchState.Error:
            break;
          case MatchState.FinishedSuccess:
            

        }
      })
  }

}*/

export class Key{
  up : string;
  down : string;
  constructor(up : string, down : string){
    this.up = up;
    this.down = down;
  }
}

/*
@Injectable({
  providedIn: 'root'
})
export class GameConfigService {
//  OnlineMatchState : OnlineMatchState;//passed at ngInit?
//  online : boolean;
  inGame : boolean;
  online : boolean;
  host : boolean;
  gameSettings? : GameSettings = undefined;
  matchState? : MatchGame = undefined;
  state : State<GameConfigState> = new State<GameConfigState>(GameConfigState.Standby);
  public readonly colorPalette = {
    darkestPurple: 0x1C0658,
    swingPurple: 0x5C2686,
    roseGarden: 0xFF1690,
    josefYellow: 0xF4D676,
    leadCyan: 0x36CDC4,
    white: 0xFFFFFF,
    black: 0x000000,
  };
  public readonly keys : Key[] = [new Key('w', 'r'), new Key('up', 'down')];//each key is a player
  // General game settings
    gameHeight = 2;
    gameWidth = 2;
    leftLimit = - this.gameWidth / 2;
    rightLimit = this.gameWidth / 2;
    topLimit = this.gameHeight / 2;
    bottomLimit = - this.gameHeight / 2;

  // Camera settings
    // Constructor settings
    public readonly fov = 75;
    public readonly aspect = 2; // the canvas default
    public readonly near = 0.1;
    public readonly far = 5;

    // Camera position
    public readonly cameraZ = 2;


  // Lighting settings
    // defaultLighting
    public readonly defaultLightingIsOn = true;
    public readonly defaultlightColor = this.colorPalette.white;
    // Light position
    public readonly defaultLightIntensity = 3;
    public readonly defaultLightPositionX = 0;
    public readonly defaultLightPositionY = 2;
    public readonly defaultLightPositionZ = 4;

  // Ball settings
    // Constructor settings
    public readonly radius = 0.05;
    public readonly widthSegments = 32;
    public readonly heightSegments = 16;
    public readonly ballColor = this.colorPalette.white;

    // Quinetity settings
    public readonly ballSpeed = 1;
    public readonly ballDir : Vector2 = new Vector2(0,1).normalize();
    // public readonly ballSpeed = 0.01;
    // public readonly ballAngle = Math.PI * -1.4 / 2;

      // Ball light settings
      public readonly ballLightColor = this.ballColor;
      public readonly ballLightIntensity = 1;

  // Paddle settings
    // Constructor settings
    public readonly paddleWidth = 0.02;//0.5;
    public readonly paddleHeight = 0.5;//0.02;
    public readonly paddleDepth = 0.1;//0.1;
    public readonly paddleColor = this.colorPalette.white;

    // Paddle position
      public readonly leftPaddle: Vector3 = new Vector3(this.leftLimit, 0, 0);
      public readonly rightPaddle: Vector3 = new Vector3(this.rightLimit, 0, 0);

    // Paddle movement settings
    public readonly paddleSpeed = 0.77;

  // Wall settings
    // Constructor settings
    public readonly wallWidth = 2 - this.paddleWidth * 2;
    public readonly wallHeight = 0.02;
    public readonly wallDepth = 0.2;
    public readonly wallColor = this.colorPalette.white;

    // Wall position
    public readonly topWall : Vector3 = new Vector3(0, this.topLimit, 0);
    public readonly bottomWall : Vector3 = new Vector3(0, this.bottomLimit, 0);
  // IA settings
    public readonly IAisOn = false;

  // Collision settings
    // Colistion change color
    public readonly collisionChangeBallColor = true;
    public readonly collisionChangeWallColor = true;
    public readonly collisionChangePaddleColor = true;

    public readonly aceleration = 0.025;

    public readonly friction = Math.PI / 6;

    public readonly deltaFactor = Math.PI / 2;

  constructor(private matchmaking : MatchmakingService) {
    if (this.matchmaking.state.getCurrentValue() === MatchMakingState.OnGame){
      if (this.matchmaking.currentMatchInfo === undefined){
        //!todo
        console.error('todo!');
        this.inGame = false;
        this.online = false;
        this.host = false;
      }else{
        this.inGame = true;
        this.online = true;
        this.host = this.matchmaking.amIHost;
        this.gameSettings = new GameSettings(GameType.Match, this.matchmaking.currentMatchInfo.name,'', false, this.matchmaking.currentMatchInfo.teamSize);
//        this.state.setValue(GameConfigState.StartingGame);
        this.matchState = matchmaking.getMatchGame();
      }
    }else{
      console.log('hello');
      this.online = false;
      this.host = false; 
      this.inGame = true;
      this.gameSettings = new GameSettings(GameType.Match, 'patata', '', false, 1);
 //     this.state.setValue(GameConfigState.StartingGame);
      //this.matchState = new MatchState()
    }
    //why not call the function? typescript doesn't realize for some reason and throws error
    //!todo fix thi shit
    this.inGame = false;
    this.online = false;
    this.host = false;
    if (matchmaking.state.getCurrentValue() === MatchMakingState.OnGame)
      this.initValues();
    matchmaking.state.observable.subscribe(value => {
      if (value === MatchMakingState.OnGame)
        this.initValues();
    });
  }


  initValues(){
    if (this.matchmaking.state.getCurrentValue() === MatchMakingState.OnGame){
      if (this.matchmaking.currentMatchInfo === undefined){
        //!todo
        console.error('todo!');
        this.inGame = false;
        this.online = false;
        this.host = false;
      }else{
        this.inGame = true;
        this.online = true;
        this.host = this.matchmaking.amIHost;
        this.gameSettings = new GameSettings(GameType.Match, this.matchmaking.currentMatchInfo.name,'', false, this.matchmaking.currentMatchInfo.teamSize);
        this.state.setValue(GameConfigState.StartingGame);
        setTimeout(()=> this.state.setValue(GameConfigState.Ingame),1000);
      }
    }else{
      console.log('hello');
      this.online = false;
      this.host = false; 
      this.inGame = true;
      this.gameSettings = new GameSettings(GameType.Match, 'patata', '', false, 1);
      this.state.setValue(GameConfigState.StartingGame);
      setTimeout(()=> this.state.setValue(GameConfigState.Ingame),1000);
      //this.matchState = new MatchState()
    }
      
  }
}*/

export class MatchConfig{
  info : MatchInfo;
  settings : MapSettings;

  constructor(info : MatchInfo, settings : MapSettings){
    this.info = info;
    this.settings = settings;
  }
}

export interface Manager{
  getConfig() : MatchConfig;
  getMatchState() : MatchState;
  getMatchScore() : Score;
  setMatchState(state : MatchState) : void;
  setMatchScore(score : Score) : void;
  subscribeMatchState(fn : any) : Subscription;
  getMatchUpdate(): MatchUpdate;
  broadcastEvent(event : PongEventType, data : EventData) : void;
  sendEvent(event : PongEventType, data : EventData) : void;
  subscribeEventObject(object : EventObject) : number;
  bindEvent(id : number, type : PongEventType) : boolean;
  getState() : GameManagerState;
}

export interface OnlineManager{
  getOnlineState() : OnlineMatchState;
}

class TournamentConfig{
  matchConfig : MatchConfig;
  numberOfPlayers : number;
  constructor(config : MatchConfig, numberOfPlayers : number){
    this.matchConfig = config;
    this.numberOfPlayers = numberOfPlayers;
  }
}

class TournamentManager implements Manager{
  matchConfig : MatchConfig;//pong entrypoint
  currentMatchState : State<MatchState>;//pong exitpoint
  currentMatchScore : State<Score>;//pong exitpoint
  currentMatchUpdate : MatchUpdate;
  numberOfPlayers : number;
  state : State<GameManagerState>;//manager state, changing it signals the match to start
  events : EventMap = new EventMap();
  constructor(config : TournamentConfig){
    this.matchConfig = config.matchConfig;
    this.numberOfPlayers = config.numberOfPlayers;
    this.currentMatchState = new State<MatchState>(MatchState.Starting);
    this.currentMatchScore = new State<Score>(new Score([0,0]));
    this.currentMatchUpdate = this.matchConfig.settings.createMatchInitUpdate(this.matchConfig.info, this);
    this.state = new State<GameManagerState>(GameManagerState.InGame);
    this.currentMatchState.subscribe(
      (state : MatchState) => {
        switch (state){
          case MatchState.Starting:
            console.error('start tournament: should have already started');
            break;
          case MatchState.Error:
            console.error('start tournament: there was an error while running a match');
            break;
          case MatchState.Running:
            console.log('start tournament: a match has started');
            break;
          case MatchState.FinishedSuccess:
            console.log('start tournament: a match has finished');
            console.log('start tournament result : ');
            break;
        }
    });

  }
  getConfig() : MatchConfig{
    return this.matchConfig;
  }
  getMatchState() : MatchState{
    return this.currentMatchState.getCurrentValue();
  }

  getMatchScore(): Score {
    return this.currentMatchScore.getCurrentValue();
  }

  setMatchScore(score: Score): void {
    this.currentMatchScore.setValue(score);
  }

  setMatchState(state: MatchState): void {
    this.currentMatchState.setValue(state);
  }

  subscribeMatchState(fn: any): Subscription {
    return this.currentMatchState.observable.subscribe(fn);
  }

  getMatchUpdate(): MatchUpdate {
    return this.currentMatchUpdate;
  }

  broadcastEvent(type: PongEventType, data : EventData): void {
    const eventObjects = this.events.getByType(type);
    if (eventObjects){
      eventObjects.forEach(object => object.runEvent(type, data));
    }
  }
  sendEvent(type: PongEventType, data : EventData): void {
    if (!data.senderId)
      return;
    const eventObject = this.events.getById(data.senderId);
    if (eventObject){
      eventObject.runEvent(type, data);
    }
  }
  
  subscribeEventObject(object : EventObject): number {
    return this.events.bind(object);
  }

  bindEvent(id : number, type: PongEventType): boolean {//false if it fails.
    return this.events.subscribe(id, type)
  }

  getState(): GameManagerState {
    return this.state.getCurrentValue();
  }

}
class MatchManager implements Manager{
  matchConfig : MatchConfig;//pong entrypoint
  matchState : State<MatchState>;//pong exitpoint
  matchScore : State<Score>;//pong exitpoint
  matchUpdate : MatchUpdate;
  state : State<GameManagerState>;//manager state, changing it signals the match to start
  events : EventMap = new EventMap();
  constructor (config : MatchConfig){
    this.matchConfig = config;
    this.matchState = new State<MatchState>(MatchState.Starting);
    this.matchScore = new State<Score>(new Score([0,0]));
    this.matchUpdate = this.matchConfig.settings.createMatchInitUpdate(this.matchConfig.info, this);
    this.state = new State<GameManagerState>(GameManagerState.InGame);
    this.matchState.subscribe(
      (state : MatchState) => {
        switch (state){
          case MatchState.Starting:
            console.error('start match: should have already started');
            break;
          case MatchState.Initialized:
            this.setMatchState(MatchState.Running);
            break;
          case MatchState.Error:
            console.error('start match: there was an error while running a match');
            break;
          case MatchState.Running:
            console.log('start match: a match has started');
            break;
          case MatchState.FinishedSuccess:
            console.log('start match: a match has finished');
            console.log('start match result : ');
            break;
        }
    })
  }

  startMatch(){
    this.matchState.setValue(MatchState.Starting);
  }

  getConfig() : MatchConfig{
    return this.matchConfig;
  }
  getMatchState() : MatchState{
    return this.matchState.getCurrentValue();
  }
  getMatchScore(): Score {
    return this.matchScore.getCurrentValue();
  }
  setMatchScore(score: Score): void {
    this.matchScore.setValue(score);
  }
  setMatchState(state: MatchState): void {
    this.matchState.setValue(state);
  }

  subscribeMatchState(fn: any): Subscription {
    return this.matchState.observable.subscribe(fn);
  }

  getMatchUpdate(): MatchUpdate {
    return this.matchUpdate;
  }
  broadcastEvent(type: PongEventType, data : EventData): void {
    const eventObjects = this.events.getByType(type);
    if (eventObjects){
      eventObjects.forEach(object => object.runEvent(type, data));
    }
  }
  sendEvent(type: PongEventType, data : EventData): void {
    if (!data.senderId)
      return;
    const eventObject = this.events.getById(data.senderId);
    if (eventObject){
      eventObject.runEvent(type, data);
    }
  }
  
  subscribeEventObject(object : EventObject): number {
    return this.events.bind(object);
  }

  bindEvent(id : number, type: PongEventType): boolean {//false if it fails.
    return this.events.subscribe(id, type)
  }

  getState(): GameManagerState {
    return this.state.getCurrentValue();
  }
}

export class OnlineMatchManager implements Manager, OnlineManager{
  //basic
  matchConfig : MatchConfig;//pong entrypoint? maybe it should be in multiplayer
  matchState : State<MatchState>;//pong exitpoint
  matchScore : State<Score>;//pong exitpoint
  matchUpdate : MatchUpdate;
  events : EventMap = new EventMap();
  state : State<GameManagerState>;//manager state, changing it signals the match to start

  //connectivity
  amIHost : boolean = false;
  onlineMatchState : State<OnlineMatchState>;

  constructor (config : MatchConfig){
    this.matchConfig = config;
    this.matchState = new State<MatchState>(MatchState.Starting);
    this.matchScore = new State<Score>(new Score([0,0]));
    this.matchUpdate = this.matchConfig.settings.createMatchInitUpdate(this.matchConfig.info, this);
    this.state = new State<GameManagerState>(GameManagerState.InGame);
    this.onlineMatchState = new State<OnlineMatchState>(OnlineMatchState.Connecting);
    this.matchState.subscribe(
      (state : MatchState) => {
        switch (state){
          case MatchState.Starting:
            console.error('start online match: should have already started');
            break;
          case MatchState.Error:
            console.error('start online match: there was an error while running a match');
            break;
          case MatchState.Running:
            console.log('start online match: a match has started');
            break;
          case MatchState.FinishedSuccess:
            console.log('start online match: a match has finished');
            console.log('start online match result : ');
            break;
        }
    });
    
  }
  getConfig() : MatchConfig{
    return this.matchConfig;
  }
  getMatchState(): MatchState {
    return this.matchState.getCurrentValue();
  }
  getMatchScore(): Score {
    return this.matchScore.getCurrentValue();
  }
  setMatchScore(score: Score): void {
    this.matchScore.setValue(score);
  }
  setMatchState(state: MatchState): void {
    this.matchState.setValue(state);
  }
  
  subscribeMatchState(fn: any): Subscription {
    return this.matchState.observable.subscribe(fn);
  }
  subscribeOnlineMatchState(fn: any): Subscription {
    return this.onlineMatchState.observable.subscribe(fn);
  }

  getMatchUpdate(): MatchUpdate {
    return this.matchUpdate;
  }

  broadcastEvent(type: PongEventType, data : EventData): void {
    const eventObjects = this.events.getByType(type);
    if (eventObjects){
      eventObjects.forEach(object => object.runEvent(type, data));
    }
  }

  sendEvent(type: PongEventType, data : EventData): void {
    if (!data.senderId)
      return;
    const eventObject = this.events.getById(data.senderId);
    if (eventObject){
      eventObject.runEvent(type, data);
    }
  }

  subscribeEventObject(object : EventObject): number {
    return this.events.bind(object);
  }

  bindEvent(id : number, type: PongEventType): boolean {//false if it fails.
    return this.events.subscribe(id, type)
  }

  addPlayer(player : UserInfo){
    if (this.amIHost)
      this.matchConfig.info.addPlayer(player, OnlinePlayerState.Connecting);
  }

  getPlayer(id : number) : OnlinePlayer | undefined{
    return this.matchConfig.info.getPlayer(id);
  }

  getState(): GameManagerState {
    return this.state.getCurrentValue();
  }

  getOnlineState(): OnlineMatchState {
    return this.onlineMatchState.getCurrentValue();
  }

  playerConnected(playerId : number | undefined) : OnlinePlayer | undefined{
    if (playerId === undefined) {
      console.error('on ice connection state change: targetId not set while being host');
      return undefined;
    }
    const player = this.matchConfig.info.getPlayer(playerId);
    if (player === undefined) {
      console.error('on ice connection state change: player wasnt set');
      console.error('sender id: ', playerId, ' current match:', this.matchConfig.info);
      return undefined;
    }
    player.changeState(OnlinePlayerState.Connected);
    return player;
  }

  areAllPlayersConnected(): boolean{
    return this.matchConfig.info.players.length + 1 === this.matchConfig.info.teamSize * 2
              && this.matchConfig.info.players.every(player => player.getState() === OnlinePlayerState.Connected);
  }

  setOnlineMatchState(state : OnlineMatchState){
    this.onlineMatchState.setValue(state);
  }
}

export enum GameManagerState{
  Standby = 'standby',
  InGame = 'in game',
}

@Injectable({
  providedIn: 'root'
})
export class GameManagerService implements Manager{
  state : State<GameManagerState>;//manager state, changing it signals the match to start
  currentManager : Manager | undefined;//a manager for each state 
  
  //currentGameConfig : MatchConfig | undefined;//pong entrypoint
  //currentGameStatus : State<[Score,MatchState]> | undefined;//pong exitpoint

  constructor (){
    this.state = new State<GameManagerState>(GameManagerState.Standby);
  }

  startTournament(config : TournamentConfig) : boolean{
    if (this.state.getCurrentValue() !== GameManagerState.Standby){
      console.error('start tournament: state must be standby to start tournament');
      return false;
    }
    this.currentManager = new TournamentManager(config);
    this.state.setValue(GameManagerState.InGame);
    return false;
  }

  startMatch(config : MatchConfig): boolean{
    if (this.state.getCurrentValue() !== GameManagerState.Standby){
      console.error('start match: state must be standby to start match');
      return false;
    }
    this.currentManager = new MatchManager(config);
    this.state.setValue(GameManagerState.InGame);
    return true;
  }

  startOnlineMatch(config : MatchConfig, amIHost : boolean) : boolean {
    if (this.state.getCurrentValue() !== GameManagerState.Standby){
      console.error('start online match: state must be standby to start online match');
      return false;
    }
    this.currentManager = new OnlineMatchManager(config);
    this.state.setValue(GameManagerState.InGame);
    return false;
  }

  onlineAddPlayer(info : UserInfo){
    if (this.currentManager instanceof OnlineMatchManager)
      this.currentManager.addPlayer(info);
  }

  getConfig() : MatchConfig{
    return this.currentManager!.getConfig();
  }

  getMatchScore(): Score {
    return this.currentManager!.getMatchScore();
  }
  getMatchState(): MatchState {
    return this.currentManager!.getMatchState();
  }
  setMatchScore(score: Score): void {
    this.currentManager!.setMatchScore(score);
  }
  setMatchState(state: MatchState): void {
    this.currentManager!.setMatchState(state);
  }

  subscribeMatchState(fn: any): Subscription {
    return this.currentManager!.subscribeMatchState(fn);
  }
  getMatchUpdate(): MatchUpdate {
    return this.currentManager!.getMatchUpdate();
  }
  broadcastEvent(type: PongEventType, data : EventData) : void {
    this.currentManager!.broadcastEvent(type, data);
  }

  sendEvent(type: PongEventType, data : EventData): void {
    this.currentManager!.sendEvent(type, data);
  }

  bindEvent(id: number, type: PongEventType): boolean {
    return this.currentManager!.bindEvent(id, type);
  }

  subscribeEventObject(object: EventObject): number {
    return this.subscribeEventObject(object);
  }


  getState(): GameManagerState {
    if (this.currentManager === undefined)
      return this.state.getCurrentValue();
    else{
      return this.currentManager!.getState();
    }
  }
}