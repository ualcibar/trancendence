import { Vector2, Vector3 } from "three";
import { MatchUpdate } from "./matchmaking.service";
import { Ball, Paddle, Block, WallType} from "../pages/pong/pong.component";
import { GameManagerService, Manager, MatchSettings } from "./game-config.service";
import { Injectable } from "@angular/core";

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

  createDefaultWalls(manager: Manager): Block[] {
    return [
      new Block(new Vector2(0, this.topLimit),
        new Vector3(2 - this.paddleWidth * 2, 0.02, 0.2),
        WallType.Collision,
        colorPalette.white,
        manager
      ),
      new Block(new Vector2(0, this.bottomLimit),
        new Vector3(2 - this.paddleWidth * 2, 0.02, 0.2),
        WallType.Collision,
        colorPalette.white,
        manager
      ),
    ];
  }
  createDefaultScoreBlocks(manager: Manager): Block[] {
    return [
      new Block(new Vector2(0, this.topLimit),
        new Vector3(2 - this.paddleWidth * 2, 0.02, 0.2),
        WallType.Collision,
        colorPalette.white,
        manager
      ),
      new Block(new Vector2(0, this.topLimit),
        new Vector3(2 - this.paddleWidth * 2, 0.02, 0.2),
        WallType.Collision,
        colorPalette.white,
        manager
      ),
    ];
  }
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
  public readonly leftPaddlePos!: Vector3;
  public readonly rightPaddlePos!: Vector3;

  // Paddle movement settings
  public readonly paddleSpeed! : number;
  public readonly paddleAceleration! : number;

  public readonly collisionChangeBallColor! : boolean;
  public readonly collisionChangeWallColor! : boolean;
  public readonly collisionChangePaddleColor! : boolean;

  public readonly friction! : number;

  public readonly deltaFactor! : number;

  public  readonly blocks : Block[];

  constructor(info : MapSettingsCreateInfo, blocks : Block[]){
    Object.assign(this, info);
    this.blocks = blocks
  }
  createMatchInitUpdate(info : MatchSettings, manager : Manager) : MatchUpdate{
    const paddles : Paddle[] = new Array<Paddle>(info.teamSize * 2);
    for (let [index,paddle] of paddles.entries()){
      const pos : Vector3 = index < info.teamSize ? this.leftPaddlePos.clone() : this.rightPaddlePos.clone();
      paddle = new Paddle(new Vector2(pos.x,pos.y),
                          new Vector2(this.paddleWidth, this.paddleHeight),
                          WallType.Collision,
                          this.paddleColor,
                          undefined,manager);
    }
    const balls : Ball[] = new Array<Ball>(1);
    balls[0] = new Ball(this.ballInitDir,
                        this.ballInitSpeed,
                        true,
                        new Vector2(0,0),
                        this.ballLightColor,
                        this.ballLightIntensity,
                        manager
    );
    return new MatchUpdate(paddles, balls,this.blocks!, 0);  
  }
}

export enum MapsName{
  Default = 'Default',
  Fancy = 'Fancy',
  Inferno = 'Inferno'
}
@Injectable({
  providedIn: 'root'
})
export class MapsService {
    maps: Map<MapsName, MapSettings> = new Map<MapsName, MapSettings>();

    constructor(private manager : GameManagerService) {
      this.initMaps()
    }

    initMaps() {
        const defaultInfo = new MapSettingsCreateInfo();

        this.maps.set(MapsName.Default, new MapSettings(defaultInfo, defaultInfo.createDefaultWalls(this.manager)));
        const infernoInfo = new MapSettingsCreateInfo();
        this.maps.set(MapsName.Inferno, new MapSettings(infernoInfo, defaultInfo.createDefaultWalls(this.manager)));
    }
    getMapSettings(map: MapsName): MapSettings | undefined {
        return this.maps.get(map);
    }
}