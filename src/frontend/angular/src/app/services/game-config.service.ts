import { Injectable } from '@angular/core';
import { GameState, GameType, MatchmakingService, MatchMakingState, MatchGame} from './matchmaking.service';
import { GameSettings } from './matchmaking.service';

import { Vector2, Vector3} from 'three';
import { State } from '../utils/state';

export enum GameConfigState{
  Standby = 'standby',
  StartingGame = 'starting game',
  Ingame = 'in game'
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
//  gameState : GameState;//passed at ngInit?
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
    public readonly ballSpeed = 0.5;
    public readonly ballDir : Vector2 = new Vector2(-0.5,1).normalize();
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
        this.matchState = matchmaking.getMatchGame();
      }
    }else{
      console.log('hello');
      this.online = false;
      this.host = false; 
      this.inGame = true;
      this.gameSettings = new GameSettings(GameType.Match, 'patata', '', false, 1);
      //this.matchState = new MatchState()
    }
    //why not call the function? typescript doesn't realize for some reason and throws error
    //!todo fix thi shit
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
        setTimeout(()=> this.state.setValue(GameConfigState.Ingame),200);
      }
    }else{
      console.log('hello');
      this.online = false;
      this.host = false; 
      this.inGame = true;
      this.gameSettings = new GameSettings(GameType.Match, 'patata', '', false, 1);
      this.state.setValue(GameConfigState.StartingGame);
      setTimeout(()=> this.state.setValue(GameConfigState.Ingame),200);
      //this.matchState = new MatchState()
    }

  }
}
