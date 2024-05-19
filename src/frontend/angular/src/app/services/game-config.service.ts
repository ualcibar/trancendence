import { Injectable } from '@angular/core';
import { OnlineMatchState, GameType, MatchmakingService, MatchMakingState, MatchGame, MatchInfo, Maps, MatchUpdate} from './matchmaking.service';
import { GameSettings } from './matchmaking.service';

import { Event, Vector2, Vector3} from 'three';
import { State } from '../utils/state';
import { Score } from './matchmaking.service';
import { Subscription } from 'rxjs';

import { EventBehaviour, PongEventType, TickBehaviour, EventObject, EventData } from '../utils/behaviour';
import { EventMap } from '../utils/eventMap';
import { Event } from 'jquery';
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

}

export class Key{
  up : string;
  down : string;
  constructor(up : string, down : string){
    this.up = up;
    this.down = down;
  }
}

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
    /*if (this.matchmaking.state.getCurrentValue() === MatchMakingState.OnGame){
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
    }*/
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
}

export const colorPalette = {
    darkestPurple: 0x1C0658,
    swingPurple: 0x5C2686,
    roseGarden: 0xFF1690,
    josefYellow: 0xF4D676,
    leadCyan: 0x36CDC4,
    white: 0xFFFFFF,
    black: 0x000000,
};

class MapSettingsCreateInfo{
  public dimmensions : Vector2 = new Vector2(2,2);
  public leftLimit : number = - this.dimmensions.width / 2; 
  public rightLimit : number = this.dimmensions.width / 2;
  public topLimit : number = this.dimmensions.height / 2;
  public bottomLimit : number = - this.dimmensions.height / 2;

  public defaultLightingIsOn  : boolean = true;
  public defaultlightColor : number = colorPalette.white;
  // Light position
  public defaultLightIntensity : number = 3;
  public defaultLightPositionX : number = 0;
  public defaultLightPositionY : number = 2;
  public defaultLightPositionZ : number = 4;

  // Ball settings
  // Constructor settings
  public ballRadius : number = 0.05;
  public ballColor : number = colorPalette.white;
  public ballInitSpeed : number = 1;
  public ballInitDir: Vector2 | undefined;//undefined === random

  // Ball light settings
  public ballLightColor : number = this.ballColor;
  public ballLightIntensity : number = 1;

  // Paddle settings
  public paddleWidth : number = 0.02;
  public paddleHeight : number =  0.5;
  public paddleDepth : number = 0.1;
  public paddleColor : number = colorPalette.white;

  // Paddle position
  public leftPaddlePos: Vector3 = new Vector3(this.leftLimit, 0, 0);
  public rightPaddlePos: Vector3 = new Vector3(this.rightLimit, 0, 0);

  // Paddle movement settings
  public paddleSpeed : number = 0.77;
  public paddleAceleration : number = 0.025;

  public collisionChangeBallColor : boolean = false;
  public collisionChangeWallColor : boolean = false;
  public collisionChangePaddleColor : boolean = false;

  public friction : number = Math.PI / 6;

  public deltaFactor : number = Math.PI / 2;
}

export class Walls{
  
}

export class MapSettings{
  // General game settings
  public readonly dimmensions! : Vector2;
  public readonly leftLimit! : number; 
  public readonly rightLimit! : number;
  public readonly topLimit! : number;
  public readonly bottomLimit! : number;

  public readonly defaultLightingIsOn!  : boolean;
  public readonly defaultlightColor! : number;
  // Light position
  public readonly defaultLightIntensity! : number;
  public readonly defaultLightPositionX! : number;
  public readonly defaultLightPositionY! : number;
  public readonly defaultLightPositionZ! : number;

  // Ball settings
  // Constructor settings
  public readonly ballRadius! : number;
  public readonly ballColor! : number;
  public readonly ballInitSpeed! : number;
  public readonly ballInitDir!: Vector2;
  public readonly ballWidthSegments = 32;
  public readonly ballHeightSegments = 16;

  // Ball light settings
  public readonly ballLightColor! : number;
  public readonly ballLightIntensity! : number;

  // Paddle settings
  public readonly paddleWidth! : number;
  public readonly paddleHeight! : number;
  public readonly paddleDepth! : number;
  public readonly paddleColor! : number;

  // Paddle position
  public readonly leftPaddle!: Vector3;
  public readonly rightPaddle!: Vector3;

  // Paddle movement settings
  public readonly paddleSpeed! : number;
  public readonly paddleAceleration! : number;

  public readonly collisionChangeBallColor! : boolean;
  public readonly collisionChangeWallColor! : boolean;
  public readonly collisionChangePaddleColor! : boolean;

  public readonly friction! : number;

  public readonly deltaFactor! : number;

  public readonly walls! : Walls[];

  constructor(info : MapSettingsCreateInfo){
    Object.assign(this, info);
  }
}

export enum MapName{
  Default = 'Default',
  Fancy = 'Fancy',
  Inferno = 'Inferno'
}
export const  maps : Map<MapName,MapSettings>;

export class MatchConfig{
  info : MatchInfo;
  settings : MatchSettings;

  constructor(info : MatchInfo, settings : MatchSettings){
    this.info = info;
    this.settings = settings;
  }
}

interface Manager{
  getConfig() : MatchConfig;
  getMatchState() : MatchState;
  getMatchScore() : Score;
  setMatchState(state : MatchState) : void;
  setMatchScore(score : Score) : void;
  subscribeState(fn : any) : Subscription;
  getMatchUpdate(): MatchUpdate;
  broadcastEvent(event : PongEventType, data : EventData) : void;
  sendEvent(event : PongEventType, data : EventData) : void;
  subscribeEventObject(object : EventObject) : number;
  bindEvent(id : number, type : PongEventType) : boolean;
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
  events : EventMap = new EventMap();
  constructor(config : TournamentConfig){
    this.matchConfig = config.matchConfig;
    this.numberOfPlayers = config.numberOfPlayers;
    this.currentMatchState = new State<MatchState>(MatchState.Starting);
    this.currentMatchScore = new State<Score>(new Score([0,0]));
    this.currentMatchUpdate = new MatchUpdate(undefined, undefined, undefined, undefined, undefined,[], 0, config.matchConfig.info);
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

  subscribeState(fn: any): Subscription {
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

}
class MatchManager implements Manager{
  matchConfig : MatchConfig;//pong entrypoint
  matchState : State<MatchState>;//pong exitpoint
  matchScore : State<Score>;//pong exitpoint
  matchUpdate : MatchUpdate;
  events : EventMap = new EventMap();
  constructor (config : MatchConfig){
    this.matchConfig = config;
    this.matchState = new State<MatchState>(MatchState.Starting);
    this.matchScore = new State<Score>(new Score([0,0]));
    this.matchUpdate = new MatchUpdate(undefined, undefined, undefined, undefined, undefined,[], 0, config.info);
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

  subscribeState(fn: any): Subscription {
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
}

class OnlineMatchManager implements Manager{
  matchConfig : MatchConfig;//pong entrypoint
  matchState : State<MatchState>;//pong exitpoint
  matchScore : State<Score>;//pong exitpoint
  matchUpdate : MatchUpdate;
  events : EventMap = new EventMap();
  constructor (config : MatchConfig){
    this.matchConfig = config;
    this.matchState = new State<MatchState>(MatchState.Starting);
    this.matchScore = new State<Score>(new Score([0,0]));
    this.matchUpdate = new MatchUpdate(undefined, undefined, undefined, undefined, undefined,[], 0, config.info);
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
  
  subscribeState(fn: any): Subscription {
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
}

export enum GameManagerState{
  Standby = 'standby',
  InMatch = 'in match',
  InOnlineMatch = 'in online match',
  InTournament = 'in tournament'
}

@Injectable({
  providedIn: 'root'
})
export class GameManager implements Manager{
  state : State<GameManagerState>;//manager state, changing it signals the match to start
  currentManager : Manager | undefined;//a manager for each state 
  
  //currentGameConfig : MatchConfig | undefined;//pong entrypoint
  //currentGameStatus : State<[Score,MatchState]> | undefined;//pong exitpoint

  constructor (matchmaking : MatchmakingService){
    this.initMaps();
    this.state = new State<GameManagerState>(GameManagerState.Standby);
  }

  startTournament(config : TournamentConfig) : boolean{
    if (this.state.getCurrentValue() !== GameManagerState.Standby){
      console.error('start tournament: state must be standby to start tournament');
      return false;
    }
    this.currentManager = new TournamentManager(config);
    this.state.setValue(GameManagerState.InTournament); 
    return false;
  }

  startMatch(config : MatchConfig): boolean{
    if (this.state.getCurrentValue() !== GameManagerState.Standby){
      console.error('start match: state must be standby to start match');
      return false;
    }
    this.currentManager = new MatchManager(config);
    this.state.setValue(GameManagerState.InMatch);
    return false;
  }

  startOnlineMatch(config : MatchConfig) : boolean {
    if (this.state.getCurrentValue() !== GameManagerState.Standby){
      console.error('start online match: state must be standby to start online match');
      return false;
    }
    this.currentManager = new OnlineMatchManager(config);
    this.state.setValue(GameManagerState.InOnlineMatch);
    return false;
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

  subscribeState(fn: any): Subscription {
    return this.currentManager!.subscribeState(fn);
  }
  getMatchUpdate(): MatchUpdate {
    return this.currentManager!.getMatchUpdate();
  }
  initMaps(){
    const defaultInfo = new MapSettingsCreateInfo();
    maps.set(MapName.Default, new MapSettings(defaultInfo));
    const infernoInfo = new MapSettingsCreateInfo();
    maps.set(MapName.Inferno, new MapSettings(infernoInfo));
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

}