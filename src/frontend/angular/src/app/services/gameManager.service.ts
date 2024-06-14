import { Injectable } from '@angular/core';
import { MatchSync, OnlineMatchSettings2, OnlineMatchState, OnlinePlayer, OnlinePlayerState} from './matchmaking.service';

import { State } from '../utils/state';
import { Score } from './matchmaking.service';
import { Subscription } from 'rxjs';

import { PongEventType, EventObject, EventData, EventBehaviour } from '../utils/behaviour';
import { GameObjectMap } from '../utils/eventMap';
import { UserInfo } from './auth.service';
import { MapSettings, MapsName } from './map.service';
import { Ball, GameObject, Paddle, PaddleState, Block } from '../components/pong/pong.component';
import { Router } from '@angular/router';
import { LogFilter, Logger } from '../utils/debug';
import { TournamentTree } from '../utils/tournamentTree';

export enum GameConfigState{
  Standby = 'standby',
  StartingGame = 'starting game',
  Ingame = 'in game'
}


export enum TournamentState{
  InGame,
  InTree,
  FinishedSuccess,
}

export enum MatchState{
  Created,
  Starting,
  Initialized,
  Running,
  Paused,
  Reset,
  FinishedSuccess,
  FinishedError,
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

export class MatchSettings{//no matter what map this settings are always applicable
  maxTimeRoundSec : number;//seconds
  maxRounds : number;
  roundsToWin : number;
  teamSize : number;
  mapName : MapsName;

  constructor( maxTimeRoundSec : number, maxRounds : number,
    roundsToWin : number, teamSize : number, mapName : MapsName){
      this.maxRounds = maxRounds;
      this.maxTimeRoundSec = maxTimeRoundSec;
      this.roundsToWin = roundsToWin;
      this.teamSize = teamSize;
      console.log('mapname', mapName);
      this.mapName = mapName;
  }
}

export class TournamentSettings{
  matchSettings : MatchSettings;
  numberOfPlayers : number;
  teamNames : string[]  = [];
  //maybe some changes for each round
  //pool of maps instead of only one
  //names for each team or player
  constructor(matchSettings : MatchSettings, numberOfPlayers : number){
    this.matchSettings = matchSettings;
    this.numberOfPlayers = numberOfPlayers;
    for(let i = 0; i < numberOfPlayers; i++){
      this.teamNames.push(`Team${i + 1}`);
    }
  }
}

/*current state update, depends on settings and map
balls:
blocks:
paddles:
paddleStates:
score:
*/

export class MatchUpdate{
  paddles : Paddle[];
  balls : Ball[];
  blocks : Block[];
  score : Score;
  id : number;
  constructor(paddles : Paddle[], balls : Ball[], blocks : Block[], score : Score, id : number){
    this.paddles = paddles;
    this.balls = balls;
    this.blocks = blocks;
    this.score = score;
    this.id = id;
  }

  subscribeAllToManager(manager : Manager){
    this.balls.forEach(ball => ball.subscribeToManager(manager));
    this.paddles.forEach(paddle => paddle.subscribeToManager(manager));
    this.blocks.forEach(block => block.subscribeToManager(manager));
  }

  runTickBehaviour(delta : number){
    // console.log('running tick behaviour')
    // console.log('delta', delta)
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

  update(update : MatchUpdate){
    for (const [index, paddle] of this.paddles.entries()){
      paddle.pos.copy(update.paddles[index].pos);
      paddle.dimmensions.copy(update.paddles[index].dimmensions);
      paddle.type = update.paddles[index].type;
      paddle.color = update.paddles[index].color;
      paddle.dir.copy(update.paddles[index].dir);
      paddle.speed = update.paddles[index].speed;
      paddle.state = update.paddles[index].state;
    }
    for (const [index, ball] of this.balls.entries()){
      ball.pos.copy(update.balls[index].pos);
      ball.dir.copy(update.balls[index].dir);
      ball.speed = update.balls[index].speed;
      ball.lightOn = update.balls[index].lightOn;
    }
    for (const [index, block] of this.blocks.entries()){
      block.pos.copy(update.blocks[index].pos);
      block.dimmensions.copy(update.blocks[index].dimmensions);
      block.type = update.blocks[index].type;
      block.material = update.blocks[index].material;
      block.speed = update.blocks[index].speed;
    }
    this.score.changeScore(update.score.score);
  }
  getAiPrediction(paddle: Paddle): number {
    console.log('paddle position', paddle.pos);
    // this.update(this); // update the current state???
    const ball = this.balls[0];
    console.log('getAiPrediction ball', ball);
    console.log('getAiPrediction paddle', paddle);
    console.log('getAiPrediction this.paddle', this.paddles[1]);
    let predictedBallY = 0;

    // IA PREDICTION

    console.log('MAKING PREDICTION');

    predictedBallY = ball.position.y +(Math.tan(ball.angle - Math.PI) * (paddle.position.x - ball.position.x)); //trigonometria
    console.log('getAiPrediction predictedBallY', predictedBallY, '=', ball.position.y, '+', 'tan(', ball.angle, ') * (', paddle.position.x, '-', ball.position.x);
    console.log('padddle position x', paddle.position.x);
    console.log('ball position', ball.position);
    // predict collision with walls
    const topWallPos = this.blocks[2].pos;
    const topWallDimmensions = this.blocks[2].dimmensions;
    const bottomWallPos = this.blocks[3].pos;
    const bottomWallDimmensions = this.blocks[3].dimmensions;
    const pseudoLimitMax = topWallPos.y - topWallDimmensions.y / 2 - ball.radius;
    const pseudoLimitMin = bottomWallPos.y + bottomWallDimmensions.y / 2 + ball.radius;
    let i = 0;
    while (predictedBallY > pseudoLimitMax || predictedBallY < pseudoLimitMin) {
      if (predictedBallY > pseudoLimitMax) {
        predictedBallY = pseudoLimitMax - (predictedBallY - pseudoLimitMax);
      }
      if (predictedBallY < pseudoLimitMin) {
        predictedBallY = pseudoLimitMin - (predictedBallY - pseudoLimitMin);
      }
      i++;
      if (i > 10) {
        console.error('infinite loop');
        break;
      }
    }

    // randomize a bit the prediction (makes it more human like)
    predictedBallY  += (Math.random() - Math.random()) * (paddle.width - ball.radius)/2 ;

    // if the ball is going to the left, make the prediction less extreme
    if (!(ball.angle < Math.PI / 2 || ball.angle > 3 * Math.PI / 2)) {
      predictedBallY = (predictedBallY) / 4.2; // 4.2 is a magic number
    }
    return predictedBallY
  }
}

export class TournamentUpdate{
  currentMatchUpdate : MatchUpdate;
  tree : TournamentTree;
  constructor (groups : string[], matchUpdate : MatchUpdate){
    this.tree = new TournamentTree(groups);
    this.currentMatchUpdate = matchUpdate;
  }
  getNextMatchPreview() : [string, string] | string{
    return this.tree.getCurrentGroups();
  }
}

export class OnlineMatchInfo{
  onlineSettings : OnlineMatchSettings2;
  host : UserInfo;
  players : Array<OnlinePlayer | undefined> = [];
  constructor (onlineSettings : OnlineMatchSettings2, host : UserInfo, players : (OnlinePlayer | undefined)[] | undefined){
    this.onlineSettings = onlineSettings;
    this.host = host;
    if (players)
      this.players = players;
    else
      this.players = new Array<OnlinePlayer | undefined>(this.onlineSettings.matchSettings.teamSize * 2 - 1).fill(undefined);
  }
  addPlayer(username: string, id : number, state : OnlinePlayerState, index : number) : boolean{
    if (this.players.length == 2 * this.onlineSettings.matchSettings.teamSize){
      return false;
    }
    this.players[index] = new OnlinePlayer(username, id, state);
    return true;
  }

  removePlayer(username : string) : boolean{
    if (username === undefined)
      return false;
    const index_to_remove = this.players.findIndex((player) => player?.username === username);
    console.log('removing player:', this.players[index_to_remove])
    this.players[index_to_remove] = undefined;
    return true;
  }
  removePlayerWithId(id : number) : boolean{
    if (id === undefined)
      return false;
    const index_to_remove = this.players.findIndex((player) => player?.id === id);
    console.log('removing player:', this.players[index_to_remove])
    this.players[index_to_remove] = undefined;
    return true;
  }

  getPlayer(playerId : number) : OnlinePlayer | undefined{
    return this.players.filter(player => player?.id === playerId)[0];
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
/*
export class OnlineMatchConfig{
  matchSettings : OnlineMatchSettings2;
  mapSettings : MapSettings;

  constructor(matchSettings : OnlineMatchSettings, mapSettings : MapSettings){
    this.matchSettings = matchSettings;
    this.mapSettings = mapSettings;
  }
}*/

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


export class TournamentManager implements Manager{
//  matchConfig : MatchConfig;//pong entrypoint
  settings : TournamentSettings;
  mapSettings : MapSettings;
  currentMatchState : State<MatchState>;//pong exitpoint
  //currentMatchScore : State<Score>;//pong exitpoint
  //currentMatchUpdate : MatchUpdate;
  update : TournamentUpdate; 
  
  state : State<GameManagerState>;//manager state, changing it signals the match to start
  gameObjects : GameObjectMap = new GameObjectMap();
  tournamentState : State<TournamentState> = new State<TournamentState>(TournamentState.InTree);
  constructor(settings : TournamentSettings,
              mapSettings : MapSettings,
              private router : Router,
              state : State<GameManagerState>){
    this.mapSettings = mapSettings;
    this.settings = settings;
    this.update = new TournamentUpdate(
      settings.teamNames,
      this.mapSettings.createMatchInitUpdate(this.settings.matchSettings, this))
    //this.currentMatchUpdate = ;
    this.state = state;
    this.update.currentMatchUpdate.subscribeAllToManager(this);
    this.currentMatchState = new State<MatchState>(MatchState.Created);
    this.currentMatchState.subscribe(
      (state : MatchState) => {
        switch (state){
          case MatchState.Initialized:
            this.setMatchState(MatchState.Running);
            break;
          case MatchState.FinishedError:
            console.error('start tournament: there was an error while running a match');
            break;
          case MatchState.Running:
            console.log('start tournament: a match has started');
            break;
          case MatchState.FinishedSuccess:
            console.log('tournament: match finished, updating tree');
            if (!this.update.tree.next(this.update.currentMatchUpdate.score)){//tournament finished
              this.tournamentState.setValue(TournamentState.FinishedSuccess)
              return;
            }
            this.tournamentState.setValue(TournamentState.InTree)
            this.update.currentMatchUpdate = this.mapSettings.createMatchInitUpdate(this.settings.matchSettings, this)
            this.update.currentMatchUpdate.subscribeAllToManager(this);
            this.update.currentMatchUpdate.score = new Score([0,0]);
            this.currentMatchState.setValue(MatchState.Created)
            break;
        }
    }); 
  }

  nextRound(){
    if (this.tournamentState.getCurrentValue() === TournamentState.InTree)
      this.tournamentState.setValue(TournamentState.InGame);
  }
  startMatch(){
    console.error('!todo: tournament: start match')
    //clear objects
    /*this.update.currentMatchUpdate = this.mapSettings.createMatchInitUpdate(this.settings.matchSettings, this);
    this.update.currentMatchUpdate.subscribeAllToManager(this);
    this.currentMatchState.setValue(MatchState.Created);
    setTimeout(() => this.currentMatchState.setValue(MatchState.Starting), 1000);
    this.router.navigate(['/play']);
    //navigate to pong?*/
  }
 
  getMapSettings(): MapSettings {
    return this.mapSettings;
  }

  getMatchSettings(): MatchSettings {
    return this.settings.matchSettings;
  }
  
  getMatchState() : MatchState{
    return this.currentMatchState.getCurrentValue();
  }

  getMatchScore(): Score {
    return this.update.currentMatchUpdate.score;
  }

  setMatchScore(score: Score): void {
    this.update.currentMatchUpdate.score.changeScore(score.score);
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
    return this.update.currentMatchUpdate;
  }

  broadcastEvent(type: PongEventType, data : EventData): void {
    switch (type) {
      case PongEventType.Score:
        {
          const score : Score = this.update.currentMatchUpdate.score;
          score.score[data.custom!.others.team] += 1;
          if (score.score[data.custom!.others.team] >= this.settings.matchSettings.roundsToWin){
            this.currentMatchState.setValue(MatchState.FinishedSuccess);
          }
          this.runEvents(this.gameObjects.getEventObjectsByType(type), type, data);
          this.mapSettings.setMatchInitUpdate(this.update.currentMatchUpdate, this.settings.matchSettings);
          break;
        }
      case PongEventType.Pause:
          this.runEvents(this.gameObjects.getEventObjectsByType(type), type, data);
          //  eventObjects.forEach(object => object.runEvent(type, data));
        break;
      default:
          this.runEvents(this.gameObjects.getEventObjectsByType(type), type, data); 
    }
  }
  runEvents(eventObjects : EventObject[], type : PongEventType, data : EventData) {
      for (let i = 0; i < eventObjects.length; i++)
        eventObjects[i].runEvent(type, data); 
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

  getState(): GameManagerState {
    return this.state.getCurrentValue();
  }

  start(): void {
    this.currentMatchState.setValue(MatchState.Starting);
  }


}
export class MatchManager implements Manager{
  matchConfig : MatchConfig;//pong entrypoint
  matchState : State<MatchState>;//pong exitpoint
//  matchScore : State<Score>;//pong exitpoint
  matchUpdate : MatchUpdate;
  state : State<GameManagerState>;//manager state, changing it signals the match to start
  gameObjects : GameObjectMap = new GameObjectMap();
  constructor (config : MatchConfig, private router : Router, state : State<GameManagerState>){
    this.matchConfig = config;
    this.state = state;
//    this.matchScore = new State<Score>(new Score([0,0]));
    this.matchUpdate = this.matchConfig.mapSettings.createMatchInitUpdate(this.matchConfig.matchSettings, this);
    this.matchUpdate.subscribeAllToManager(this);
    this.matchState = new State<MatchState>(MatchState.Created);
    this.matchState.subscribe(
      (state : MatchState) => {
        switch (state){
          case MatchState.Initialized:
            this.setMatchState(MatchState.Running);
            break;
          case MatchState.FinishedError:
            console.error('start match: there was an error while running a match');
            break;
          case MatchState.Running:
            console.log('start match: a match has started');
            break;
          case MatchState.FinishedSuccess:
            console.log('start match: a match has finished');
            console.log('start match result : ');
            this.state.setValue(GameManagerState.Standby)
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
    return this.matchUpdate.score;
  }
  setMatchScore(score: Score): void {
    this.matchUpdate.score.changeScore(score.score);
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
          this.matchUpdate.score.score[data.custom?.others.team] += 1;
          //send events
          this.runEvents(this.gameObjects.getEventObjectsByType(type), type, data);

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
      default:
          this.runEvents(this.gameObjects.getEventObjectsByType(type), type, data); 
    }
  }
  sendEvent(type: PongEventType, data : EventData): void {
    console.log('send event', type, data);
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
  info : OnlineMatchInfo;//pong entrypoint? maybe it should be in multiplayer
  mapSettings : MapSettings;
  matchState : State<MatchState>;//pong exitpoint
  
  matchUpdate : MatchUpdate;
  gameObjects : GameObjectMap = new GameObjectMap();
  state : State<GameManagerState>;//manager state, changing it signals the match to start

  //connectivity
  amIHost : boolean;
  onlineMatchState : State<OnlineMatchState>;
  updateMatchInterval : number = 0;
  matchSync! : MatchSync;

  //logger
  logger : Logger = new Logger(LogFilter.ManagerOnlineLogger, 'online manager:');

  constructor (info : OnlineMatchInfo,
               mapSettings : MapSettings,
               private router : Router,
               matchSync : MatchSync,
               onlineState : OnlineMatchState,
               amIHost: boolean,
               state : State<GameManagerState>){
    this.amIHost = amIHost;
    this.info = info;
    //this.matchScore = new State<Score>(new Score([0,0]));
    this.mapSettings = mapSettings; 
    this.matchUpdate = this.mapSettings.createMatchInitUpdate(this.info.onlineSettings.matchSettings, this);
    this.matchUpdate.subscribeAllToManager(this);
    this.state = state;
    this.matchState = new State<MatchState>(MatchState.Created);
    this.onlineMatchState = new State<OnlineMatchState>(onlineState);
    this.matchSync = matchSync;
    this.matchState.subscribe(
      (state : MatchState) => {
        switch (state){
          case MatchState.Initialized:
            this.setMatchState(MatchState.Running);//wrong
            break;
          case MatchState.FinishedError:
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
            this.state.setValue(GameManagerState.Standby)
            break;
        }
    });
    
  }
  
  getMapSettings(): MapSettings {
    return this.mapSettings;
  }

  getMatchSettings(): MatchSettings {
    return this.info.onlineSettings.matchSettings;
  }
  
  getMatchState(): MatchState {
    return this.matchState.getCurrentValue();
  }
  getMatchScore(): Score {
    return this.matchUpdate.score;
  }
  setMatchScore(score: Score): void {
    this.matchUpdate.score.changeScore(score.score);
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
            this.matchUpdate.score.score[data.custom?.others.team] += 1;
            this.logger.info('score increated host', this.matchUpdate.score.score)
            this.runEvents(this.gameObjects.getEventObjectsByType(type), type, data);
            this.mapSettings.setMatchInitUpdate(this.matchUpdate, this.info.onlineSettings.matchSettings);
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
    //this.logger.error('!todo') 
  }
  broadcastRemoteEvent(type : PongEventType, data : EventData){//only for sincronization
    //todo should convert the data back to local data
    this.logger.info('received event broadcast', type, data)
    switch (type){
      case PongEventType.Score:
        if (!this.amIHost){ 
          this.matchUpdate.score.score[data.custom?.others.team] += 1;
          this.logger.info('score increated client', this.matchUpdate.score)
          this.runEvents(this.gameObjects.getEventObjectsByType(type), type, this.syncEventDataToEventData(data));
          this.mapSettings.setMatchInitUpdate(this.matchUpdate, this.info.onlineSettings.matchSettings); 
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


  addPlayer(username: string, id : number, index : number){
    //if (this.amIHost)
      this.info.addPlayer(username, id, OnlinePlayerState.Connecting, index);
  }

  getPlayer(id : number) : OnlinePlayer | undefined{
    return this.info.getPlayer(id);
  }

  getState(): GameManagerState {
    return this.state.getCurrentValue();
  }

  getOnlineState(): OnlineMatchState {
    return this.onlineMatchState.getCurrentValue();
  }

  playerConnected(playerId : number) : OnlinePlayer | undefined{//sets player with id to connected, returns it
    const player = this.info.getPlayer(playerId);
    if (player === undefined) {
      console.error('on ice connection state change: player wasnt set');
      console.error('sender id: ', playerId, ' current match:', this.info.onlineSettings.matchSettings);
      return undefined;
    }
    player.changeState(OnlinePlayerState.Connected);
    return player;
  }
  playerReconnected(playerId: number): OnlinePlayer | undefined {//sets player with id to connected, returns it
    if (this.onlineMatchState.getCurrentValue() != OnlineMatchState.Connecting ||
      this.onlineMatchState.getCurrentValue() != OnlineMatchState.WaitingForPlayers) {
      const player = this.info.getPlayer(playerId);
      if (player === undefined) {
        console.error('on ice connection state change: player wasnt set');
        console.error('sender id: ', playerId, ' current match:', this.info.onlineSettings.matchSettings);
        return undefined;
      }
      player.changeState(OnlinePlayerState.Connected);
      return player;
    }
    return undefined
  }


  playerDisconnected(playerId : number){
    console.log('STATE!!!!', this.onlineMatchState.getCurrentValue())
    if (this.onlineMatchState.getCurrentValue() == OnlineMatchState.Connecting ||
        this.onlineMatchState.getCurrentValue() == OnlineMatchState.WaitingForPlayers){
      //during matchmaking
      this.logger.info('removing player')
      if (!this.info.removePlayerWithId(playerId))
        this.logger.error('failed to remove disconnected player')
    }else{
      const player = this.info.getPlayer(playerId)
      if (!player){
        this.logger.error('couldn\' get player')
        return
      }
      player.state.setValue(OnlinePlayerState.Disconnected);
    }
  }

  areAllPlayersConnected(): boolean{
    console.log(this.info.players)
    console.log(this.info.players.every(player => player !== undefined && player.getState() === OnlinePlayerState.Connected))
    return this.info.players.every(player => player !== undefined && player.getState() === OnlinePlayerState.Connected);
  }

  setOnlineMatchState(state : OnlineMatchState){
    this.onlineMatchState.setValue(state);
  }

  getOnlineMatchSettings() : OnlineMatchSettings2{
    return this.info.onlineSettings;
  }
  start(): void {
    this.matchState.setValue(MatchState.Starting);
    this.onlineMatchState.setValue(OnlineMatchState.Running)
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

export enum RealManagerType{
  Match,
  Tournament,
  OnlineMatch,
}

@Injectable({
  providedIn: 'root'
})
export class GameManagerService implements Manager{
  private state : State<GameManagerState>;//manager state, changing it signals the match to start
  currentManager : Manager | undefined;//a manager for each state 
  realManagerType : RealManagerType | undefined;
  realManager : MatchManager | TournamentManager | OnlineMatchManager | undefined; 

  constructor (private router : Router){
    this.state = new State<GameManagerState>(GameManagerState.Standby);
  }
   
  start(): void {
    this.currentManager?.start();
  }


  createTournament(config : TournamentSettings, mapSettings : MapSettings) : TournamentManager | undefined{
    if (this.state.getCurrentValue() !== GameManagerState.Standby){
      console.error('start tournament: state must be standby to start tournament');
      return;
    }
    const tournamentManager = new TournamentManager(config, mapSettings, this.router, this.state);
    this.currentManager = tournamentManager;
    this.state.setValue(GameManagerState.InGame);
    this.realManagerType = RealManagerType.Tournament;
    this.realManager = tournamentManager;
    return tournamentManager;
  }

  createMatch(config : MatchConfig): boolean{
    if (this.state.getCurrentValue() !== GameManagerState.Standby){
      console.error('start match: state must be standby to start match');
      return false;
    }
    const manager = new MatchManager(config, this.router, this.state);
    this.currentManager = manager;
    this.state.setValue(GameManagerState.InGame);
    this.realManagerType = RealManagerType.Match;
    this.realManager = manager;
    return true;
  }

  createOnlineMatch(info : OnlineMatchInfo, mapSettings : MapSettings, amIHost : boolean, matchSync : MatchSync, onlineState : OnlineMatchState) : OnlineMatchManager | undefined {
    if (this.state.getCurrentValue() !== GameManagerState.Standby){
      console.error('start online match: state must be standby to start online match');
      return undefined;
    }
    const manager = new OnlineMatchManager(info, mapSettings,  this.router, matchSync, onlineState, amIHost, this.state);
    this.currentManager = manager; 
    this.realManagerType = RealManagerType.OnlineMatch;
    this.realManager = manager;
    this.state.setValue(GameManagerState.InGame);
    return manager;
  }

  onlineAddPlayer(username : string, id : number, index : number){
    if (this.currentManager instanceof OnlineMatchManager)
      this.currentManager.addPlayer(username, id, index);
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

  getRealManagerType() : RealManagerType{
    return this.realManagerType!;
  }
  getRealManager() : MatchManager | OnlineMatchManager | TournamentManager{
    return this.realManager!;
  }

  getState(): GameManagerState {
    if (this.currentManager === undefined)
      return this.state.getCurrentValue();
    else{
      return this.currentManager!.getState();
    }
  }
}