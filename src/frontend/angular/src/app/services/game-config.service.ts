import { Injectable } from '@angular/core';
import { GameSettings, MatchSync, MatchUpdate, MatchmakingService, OnlineMatchState, OnlinePlayer, OnlinePlayerState} from './matchmaking.service';

import { State } from '../utils/state';
import { Score } from './matchmaking.service';
import { Subscription } from 'rxjs';

import { PongEventType, EventObject, EventData, EventBehaviour } from '../utils/behaviour';
import { GameObjectMap } from '../utils/eventMap';
import { UserInfo } from './auth.service';
import { MapSettings } from './map.service';
import { GameObject, PaddleState } from '../pages/pong/pong.component';
import { EventType, Router } from '@angular/router';
import { LogFilter, Logger } from '../utils/debug';
import { event, get } from 'jquery';
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
  Created = 'Created',
  Starting = 'starting',
  Initialized = 'initialized',
  Running = 'running',
  Paused = 'paused',
  Reset = 'reset',
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

export class MatchSettings{
  paddleStates : PaddleState[];
  score : Score;
  teamSize : number;
  winScore : number;
 
  constructor (teamSize : number, paddleStates : PaddleState[], winScore : number){
    this.teamSize = teamSize;
    this.paddleStates = paddleStates;
    this.score = new Score([0,0]);
    this.winScore = winScore;
  }
}

export class OnlineMatchSettings{
  settings : MatchSettings;
  host : UserInfo;
  players : OnlinePlayer[] = [];
  name : string;
  constructor (settings : MatchSettings, name : string, host : UserInfo){
    this.settings = settings;
    this.name = name;
    this.host = host;
  }
  addPlayer(newPlayer : UserInfo, state : OnlinePlayerState) : boolean{
    if (this.players.length == 2 * this.settings.teamSize){
      return false;
    }
    this.players.push(new OnlinePlayer(newPlayer, state));
    return true;
  }

  removePlayer(username : string) : boolean{
    const index_to_remove = this.players.findIndex((player) => player.info.username == username);
    if (index_to_remove === -1)
      return false;
    this.players.splice(index_to_remove, 1);
    return true
  }

  getPlayer(playerId : number) : OnlinePlayer | undefined{
    return this.players.filter(player => player.info.user_id === playerId)[0];
  }
}

export class MatchConfig{
  matchSettings : MatchSettings;
  mapSettings : MapSettings;

  constructor(matchSettings : MatchSettings, mapSettings : MapSettings){
    this.matchSettings = matchSettings;
    this.mapSettings = mapSettings;
  }
}
export class OnlineMatchConfig{
  matchSettings : OnlineMatchSettings;
  mapSettings : MapSettings;

  constructor(matchSettings : OnlineMatchSettings, mapSettings : MapSettings){
    this.matchSettings = matchSettings;
    this.mapSettings = mapSettings;
  }
}

export interface Manager{
  getMapSettings() : MapSettings;
  getMatchSettings() : MatchSettings;
  getMatchState() : MatchState;
  getMatchScore() : Score;
  setMatchState(state : MatchState) : void;
  setMatchScore(score : Score) : void;
  subscribeMatchState(fn : any) : Subscription;
  getMatchUpdate(): MatchUpdate;
  broadcastEvent(event : PongEventType, data : EventData) : void;
  sendEvent(event : PongEventType, data : EventData) : void;
  subscribeEventObject(object : EventObject, id : number) : void;
  subscribeGameObject(object : GameObject) : number;
  bindEvent(id : number, type : PongEventType) : boolean;
  getState() : GameManagerState;
  start() : void;
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
  gameObjects : GameObjectMap = new GameObjectMap();
  constructor(config : TournamentConfig, private router : Router){
    this.matchConfig = config.matchConfig;
    this.numberOfPlayers = config.numberOfPlayers;
    this.currentMatchScore = new State<Score>(new Score([0,0]));
    this.currentMatchUpdate = this.matchConfig.mapSettings.createMatchInitUpdate(this.matchConfig.matchSettings, this);
    this.state = new State<GameManagerState>(GameManagerState.InGame);
    this.currentMatchUpdate.subscribeAllToManager(this);
    this.currentMatchState = new State<MatchState>(MatchState.Created);
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
    //this.router.navigate(['play']);
  }
  
  getMapSettings(): MapSettings {
    return this.matchConfig.mapSettings;
  }

  getMatchSettings(): MatchSettings {
    return this.matchConfig.matchSettings;
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

  subscribeGameObject(object: GameObject): number {
    return this.gameObjects.subscribeGameObject(object);
  }
 
  subscribeEventObject(object : EventObject, id : number){
    this.gameObjects.subscribeEventObject(object, id);
  }
  
  bindEvent(id : number, type: PongEventType): boolean {//false if it fails.
    return this.gameObjects.bind(type, id)
  }


  getMatchUpdate(): MatchUpdate {
    return this.currentMatchUpdate;
  }

  broadcastEvent(type: PongEventType, data : EventData): void {
    this.runEvents(this.gameObjects.getEventObjectsByType(type), type, data);
  }
  runEvents(eventObjects : EventObject[], type : PongEventType, data : EventData) {
      for (let i = 0; i < eventObjects.length; i++)
        eventObjects[i].runEvent(type, data); 
  }
  sendEvent(type: PongEventType, data : EventData): void {
    console.log('event sent!!', type)
    if (!data.senderId)
      return;
    const eventObject = this.gameObjects.getEventObjectById(data.senderId);
    if (eventObject){
      eventObject.runEvent(type, data);
    }
  }

  getState(): GameManagerState {
    return this.state.getCurrentValue();
  }

  start(): void {
    this.currentMatchState.setValue(MatchState.Starting);
  }


}
class MatchManager implements Manager{
  matchConfig : MatchConfig;//pong entrypoint
  matchState : State<MatchState>;//pong exitpoint
  matchScore : State<Score>;//pong exitpoint
  matchUpdate : MatchUpdate;
  state : State<GameManagerState>;//manager state, changing it signals the match to start
  gameObjects : GameObjectMap = new GameObjectMap();
  constructor (config : MatchConfig, private router : Router){
    this.matchConfig = config;
    this.matchScore = new State<Score>(new Score([0,0]));
    this.matchUpdate = this.matchConfig.mapSettings.createMatchInitUpdate(this.matchConfig.matchSettings, this);
    this.matchUpdate.subscribeAllToManager(this);
    this.matchState = new State<MatchState>(MatchState.Created);
    this.state = new State<GameManagerState>(GameManagerState.InGame);
    this.matchState.subscribe(
      (state : MatchState) => {
        switch (state){
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

  getMapSettings(): MapSettings {
    return this.matchConfig.mapSettings;
  }

  getMatchSettings(): MatchSettings {
    return this.matchConfig.matchSettings;
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
    switch (type) {
      case PongEventType.Score:
        {
          //change score
          this.matchConfig.matchSettings.score.score[data.custom?.others.team] += 1;
          //send events
          this.runEvents(this.gameObjects.getEventObjectsByType(type), type, data);

          const scorer = data.custom?.others.team;
          const winScore = this.matchConfig.matchSettings.winScore;
          const updatedScore = this.matchConfig.matchSettings.score.score[scorer];
          // console.log('updated score', updatedScore, 'win score', winScore)
          if (updatedScore >= winScore)
          {
            console.log('game over');
            this.broadcastEvent(PongEventType.GameOver, data = {custom : {others : {winner : scorer}}});
          }
          //reset match and go for the next round if any
          this.matchConfig.mapSettings.setMatchInitUpdate(this.matchUpdate, this.matchConfig.matchSettings);
          /*this.broadcastEvent(PongEventType.Pause, {});
          this.matchState.setValue(MatchState.Paused);
          this.broadcastEvent(PongEventType.Reset, {});
          this.matchState.setValue(MatchState.Reset);
          this.broadcastEvent(PongEventType.Continue, {});*/
          break;
        }
      case PongEventType.Pause:
          this.runEvents(this.gameObjects.getEventObjectsByType(type), type, data);
          //  eventObjects.forEach(object => object.runEvent(type, data));
        break;
      case PongEventType.GameOver:
          this.runEvents(this.gameObjects.getEventObjectsByType(type), type, data);
          //  eventObjects.forEach(object => object.runEvent(type, data));
          const winner = data.custom?.others.winner;
          const score = this.matchConfig.matchSettings.score.score;
          const message = 'Player ' + (1 + winner) + ' wins with a score of ' + score[0] + ' - ' + score[1] + '!';
          // TODO: handle game over properly
          alert(message);
          window.location.reload();
        break;
      default:
          this.runEvents(this.gameObjects.getEventObjectsByType(type), type, data); 
    }
  }
  sendEvent(type: PongEventType, data : EventData): void {
    if (data.targetIds === undefined){
      console.error('send event needs targetsid')
      return;
    }
    if (data.targetIds instanceof Array){
      for (let i = 0; i < data.targetIds.length; i++){
      const eventObject = this.gameObjects.getEventObjectById(data.targetIds[i]);
      if (eventObject) {
        eventObject.runEvent(type, data);
      }

      }
    } else {
      const eventObject = this.gameObjects.getEventObjectById(data.targetIds);
      if (eventObject)
        eventObject.runEvent(type, data);
      else
        console.error('couldnt find target id')
    }
  }
  
  subscribeGameObject(object: GameObject): number {
    return this.gameObjects.subscribeGameObject(object);
  }
 
  subscribeEventObject(object : EventObject, id : number){
    this.gameObjects.subscribeEventObject(object, id);
  }
  
  bindEvent(id : number, type: PongEventType): boolean {//false if it fails.
    return this.gameObjects.bind(type, id)
  }


  getState(): GameManagerState {
    return this.state.getCurrentValue();
  }
  start(): void {
    this.matchState.setValue(MatchState.Starting);
  }
  runEvents(eventObjects : EventObject[], type : PongEventType, data : EventData) {
      for (let i = 0; i < eventObjects.length; i++)
        eventObjects[i].runEvent(type, data); 
  }
}

export class OnlineMatchManager implements Manager, OnlineManager{
  //basic
  matchConfig : OnlineMatchConfig;//pong entrypoint? maybe it should be in multiplayer
  matchState : State<MatchState>;//pong exitpoint
  matchScore : State<Score>;//pong exitpoint
  matchUpdate : MatchUpdate;
  gameObjects : GameObjectMap = new GameObjectMap();
  state : State<GameManagerState>;//manager state, changing it signals the match to start

  //connectivity
  amIHost : boolean;
  onlineMatchState : State<OnlineMatchState>;
  updateMatchInterval : number = 0;
  matchSync! : MatchSync;

  //logger
  logger : Logger = new Logger(LogFilter.managerOnlineLogger, 'online manager:');

  constructor (config : OnlineMatchConfig, private router : Router, matchSync : MatchSync, onlineState : OnlineMatchState, amIHost: boolean){
    this.amIHost = amIHost;
    this.matchConfig = config;
    this.matchScore = new State<Score>(new Score([0,0]));
    this.matchUpdate = this.matchConfig.mapSettings.createMatchInitUpdate(this.matchConfig.matchSettings.settings, this);
    this.matchUpdate.subscribeAllToManager(this);
    this.state = new State<GameManagerState>(GameManagerState.InGame);
    this.matchState = new State<MatchState>(MatchState.Created);
    this.onlineMatchState = new State<OnlineMatchState>(onlineState);
    this.matchSync = matchSync;
    this.matchState.subscribe(
      (state : MatchState) => {
        switch (state){
          case MatchState.Initialized:
            this.setMatchState(MatchState.Running);
            break;
          case MatchState.Error:
            console.error('start online match: there was an error while running a match');
            break;
          case MatchState.Running:
            if (this.amIHost){
              this.updateMatchInterval = setInterval(() => {
                this.matchSync.sendMatchUpdate(this.matchUpdate);
              }, 50);
            }
            console.log('start online match: a match has started');
            break;
          case MatchState.FinishedSuccess:
            console.log('start online match: a match has finished');
            console.log('start online match result : ');
            break;
        }
    });
    
  }
  
  getMapSettings(): MapSettings {
    return this.matchConfig.mapSettings;
  }

  getMatchSettings(): MatchSettings {
    return this.matchConfig.matchSettings.settings;
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
    switch (type) {
      case PongEventType.Score:
        {
          if (this.amIHost){
            this.matchSync.broadcastEvent(type, data);
            this.matchConfig.matchSettings.settings.score.score[data.custom?.others.team] += 1;
            this.logger.info('score increated host', this.matchConfig.matchSettings.settings.score.score)
            this.runEvents(this.gameObjects.getEventObjectsByType(type), type, data);
            this.matchConfig.mapSettings.setMatchInitUpdate(this.matchUpdate, this.matchConfig.matchSettings.settings);
//            this.matchSync.broadcastEvent(type, data);
          }
          //change score
          /*this.broadcastEvent(PongEventType.Pause, {});
          this.matchState.setValue(MatchState.Paused);
          this.broadcastEvent(PongEventType.Reset, {});
          this.matchState.setValue(MatchState.Reset);
          this.broadcastEvent(PongEventType.Continue, {});*/
          break;
        }
      default:
        if (this.amIHost){
          //this.matchSync.broadcastEvent(type, this.eventDataToSyncData(data));
          this.runEvents(this.gameObjects.getEventObjectsByType(type), type, data);
        }
    }
  }

  eventDataToSyncData(eventData : EventData) : EventData{
    if (eventData.custom === undefined || eventData.custom.gameObjects === undefined)
      return eventData;
    const newObj : {[key : string] : number} = {};
    for (const key in eventData.custom.gameObjects){
      newObj[key] = eventData.custom.gameObjects[key].getId();
    } 
    const gameObjects : any = newObj;
    this.logger.info('event data sync: before', eventData.custom.gameObjects, 'after', gameObjects)
    return {
      senderId : eventData.senderId,
      targetIds : eventData.targetIds,
      broadcast : eventData.broadcast,
      custom : {
        others : eventData.custom.others,
        gameObjects : gameObjects
      }
    };
  }
  syncEventDataToEventData(eventData : EventData) : EventData{
    if (eventData.custom === undefined || eventData.custom.gameObjects === undefined)
      return eventData;
    const newObj : {[key : string] : GameObject} = {};
    for (const key in eventData.custom.gameObjects){
      newObj[key] = this.gameObjects.getGameObjectById(eventData.custom.gameObjects[key])!;
    } 
    const gameObjects : any = newObj;
    this.logger.info('event data sync: before', eventData.custom.gameObjects, 'after', gameObjects)
    return {
      senderId : eventData.senderId,
      targetIds : eventData.targetIds,
      broadcast : eventData.broadcast,
      custom : {
        others : eventData.custom.others,
        gameObjects : gameObjects
      }
    };
  }

  sendEvent(type: PongEventType, data : EventData): void {
    if (!this.amIHost)
      return;
    if (data.targetIds === undefined){
      console.error('online send event needs targetsid')
      return;
    }
    if (data.targetIds instanceof Array){
      for (let i = 0; i < data.targetIds.length; i++) {
        const eventObject = this.gameObjects.getEventObjectById(data.targetIds[i]);
        if (eventObject) {
          this.matchSync.sendEvent(type, this.eventDataToSyncData(data))
          eventObject.runEvent(type, data);
        }
      }
    } else {
      const eventObject = this.gameObjects.getEventObjectById(data.targetIds);
      if (eventObject){
        this.matchSync.sendEvent(type, this.eventDataToSyncData(data))
        eventObject.runEvent(type, data);
      }
      else
        console.error('online send event: couldnt find target id')
    }
  }

  sendRemoteEvent(type : PongEventType, data : EventData){//only for sincronization
    this.logger.info('received event send', type, data)
    this.sendEvent(type, this.syncEventDataToEventData(data));
    this.logger.error('!todo') 
  }
  broadcastRemoteEvent(type : PongEventType, data : EventData){//only for sincronization
    //todo should convert the data back to local data
    this.logger.info('received event broadcast', type, data)
    switch (type){
      case PongEventType.Score:
        if (!this.amIHost){ 
          this.matchConfig.matchSettings.settings.score.score[data.custom?.others.team] += 1;
          this.logger.info('score increated client', this.matchConfig.matchSettings.settings.score.score)
          this.runEvents(this.gameObjects.getEventObjectsByType(type), type, this.syncEventDataToEventData(data));
          this.matchConfig.mapSettings.setMatchInitUpdate(this.matchUpdate, this.matchConfig.matchSettings.settings); 
        }
        break;
      default:
        this.runEvents(this.gameObjects.getEventObjectsByType(type), type, this.syncEventDataToEventData(data));//!todo must turn syncdata to local data
    }
  }

  subscribeGameObject(object: GameObject): number {
    return this.gameObjects.subscribeGameObject(object);
  }

  subscribeEventObject(object : EventObject, id : number): void {
    this.gameObjects.subscribeEventObject(object, id);
  }

  bindEvent(id : number, type: PongEventType): boolean {//false if it fails.
    return this.gameObjects.bind(type, id)
  }


  addPlayer(player : UserInfo){
    //if (this.amIHost)
      this.matchConfig.matchSettings.addPlayer(player, OnlinePlayerState.Connecting);
  }

  getPlayer(id : number) : OnlinePlayer | undefined{
    return this.matchConfig.matchSettings.getPlayer(id);
  }

  getState(): GameManagerState {
    return this.state.getCurrentValue();
  }

  getOnlineState(): OnlineMatchState {
    return this.onlineMatchState.getCurrentValue();
  }

  playerConnected(playerId : number) : OnlinePlayer | undefined{//sets player with id to connected, returns it
    const player = this.matchConfig.matchSettings.getPlayer(playerId);
    if (player === undefined) {
      console.error('on ice connection state change: player wasnt set');
      console.error('sender id: ', playerId, ' current match:', this.matchConfig.matchSettings);
      return undefined;
    }
    player.changeState(OnlinePlayerState.Connected);
    return player;
  }

  areAllPlayersConnected(): boolean{
    return this.matchConfig.matchSettings.players.length + 1 === this.matchConfig.matchSettings.settings.teamSize * 2
              && this.matchConfig.matchSettings.players.every(player => player.getState() === OnlinePlayerState.Connected);
  }

  setOnlineMatchState(state : OnlineMatchState){
    this.onlineMatchState.setValue(state);
  }

  getOnlineMatchSettings() : OnlineMatchSettings{
    return this.matchConfig.matchSettings;
  }
  start(): void {
    this.matchState.setValue(MatchState.Starting);
  }
  runEvents(eventObjects : EventObject[], type : PongEventType, data : EventData) {
      for (let i = 0; i < eventObjects.length; i++)
        eventObjects[i].runEvent(type, data); 
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

  constructor (private router : Router){
    this.state = new State<GameManagerState>(GameManagerState.Standby);
  }
   
  start(): void {
    this.currentManager?.start();
  }


  createTournament(config : TournamentConfig) : boolean{
    if (this.state.getCurrentValue() !== GameManagerState.Standby){
      console.error('start tournament: state must be standby to start tournament');
      return false;
    }
    this.currentManager = new TournamentManager(config, this.router);
    this.state.setValue(GameManagerState.InGame);
    return true;
  }

  createMatch(config : MatchConfig): boolean{
    if (this.state.getCurrentValue() !== GameManagerState.Standby){
      console.error('start match: state must be standby to start match');
      return false;
    }
    this.currentManager = new MatchManager(config, this.router);
    this.state.setValue(GameManagerState.InGame);
    return true;
  }

  createOnlineMatch(config : OnlineMatchConfig, amIHost : boolean, matchSync : MatchSync, onlineState : OnlineMatchState) : OnlineMatchManager | undefined {
    if (this.state.getCurrentValue() !== GameManagerState.Standby){
      console.error('start online match: state must be standby to start online match');
      return undefined;
    }
    const manager = new OnlineMatchManager(config, this.router, matchSync, onlineState, amIHost);
    this.currentManager = manager; 
    this.state.setValue(GameManagerState.InGame);
    return manager;
  }

  onlineAddPlayer(info : UserInfo){
    if (this.currentManager instanceof OnlineMatchManager)
      this.currentManager.addPlayer(info);
  }

  getMapSettings(): MapSettings {
    return this.currentManager!.getMapSettings();
  }

  getMatchSettings(): MatchSettings {
    return this.currentManager!.getMatchSettings();
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
    return this.currentManager!.subscribeMatchState(fn);//got an error
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

  subscribeEventObject(object: EventObject, id : number): void {
    this.currentManager!.subscribeEventObject(object, id);
  }

  subscribeGameObject(object: GameObject): number {
    return this.currentManager!.subscribeGameObject(object)
  }


  getState(): GameManagerState {
    if (this.currentManager === undefined)
      return this.state.getCurrentValue();
    else{
      return this.currentManager!.getState();
    }
  }
}