import { Vector2, Vector3 } from "three";
import { Ball, Paddle, Block, BlockType, RenderMaterial, RenderMaterialType, PaddleState} from "../components/pong/pong.component";
import { GameManagerService, GameManagerState, Key, Manager, MatchSettings, MatchState, MatchUpdate } from "./gameManager.service";
import { Injectable } from "@angular/core";
import { createEventScoreColision, createTickMove, createEventPaddleColision, eventEventWallColision, createTickUpdate, createEventIAprediction, createPaddleUpdate } from "../utils/behaviour";
import { Score } from "./matchmaking.service";
import * as THREE from 'three';

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

  public defaultLightingIsOn  : boolean = false;
  public defaultlightColor : number = colorPalette.white;
  // Light position
  public defaultLightIntensity : number = 3;
  public defaultLightPositionX : number = 0;
  public defaultLightPositionY : number = 2;
  public defaultLightPositionZ : number = 4;

  public additionalLights : THREE.Light[] = [];
  // Ball settings
  // Constructor settings
  public ballRadius : number = 0.05;
  public ballColor : number = colorPalette.white;
  public ballInitSpeed : number = 1;
  public ballInitDir: Vector2 = new Vector2(-1,0);//undefined === random

  // Ball light settings
  public ballLightIsOn : boolean = false;
  public ballLightColor : number = this.ballColor;
  public ballLightIntensity : number = 1;

  // Paddle settings
  public paddleWidth : number = 0.05;
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
    const blocks = [
      new Block(new Vector2(0, this.topLimit),
        new Vector3(2 - this.paddleWidth * 2, 0.02, 0.2),
        BlockType.Collision,
        new RenderMaterial(RenderMaterialType.colored,colorPalette.white),
        manager
      ),
      new Block(new Vector2(0, this.bottomLimit),
        new Vector3(2 - this.paddleWidth * 2, 0.02, 0.2),
        BlockType.Collision,
        new RenderMaterial(RenderMaterialType.colored, colorPalette.white),
        manager
      ),
    ];
    blocks.forEach(block => {
      block.bindEvent(eventEventWallColision)
    })
 
    return  blocks;
  }
  createDefaultScoreBlocks(manager: Manager): Block[] {
    const width = 42;
    const blocks = [
      new Block(
        new Vector2(this.leftLimit - this.ballRadius * 4  - width/2, 0),
        new Vector3(width, this.dimmensions.height * 2, 0.02),
        BlockType.Score,
        new RenderMaterial(RenderMaterialType.colored, colorPalette.black),
        manager
      ),
      new Block(
        new Vector2(this.rightLimit + this.ballRadius * 4 +  width/2, 0),
        new Vector3(width, this.dimmensions.height * 2, 0.02),
        BlockType.Score,
        new RenderMaterial(RenderMaterialType.colored, colorPalette.black),
        manager
      ),
    ];

    //blocks.forEach(block => {
    blocks[0].bindEvent(createEventScoreColision(manager, blocks[0], 1));
    blocks[1].bindEvent(createEventScoreColision(manager, blocks[1], 0));
    //})

    return blocks;
  }

  // createFancyScoreBlocks(manager: Manager): Block[] {
  //   const width = 42;
  //   const blocks = [
  //     new Block(
  //       new Vector2(this.leftLimit - this.ballRadius * 4  - width/2, 0),
  //       new Vector3(width, this.dimmensions.height * 2, width),
  //       BlockType.Score,
  //       new RenderMaterial(RenderMaterialType.colored, colorPalette.roseGarden),
  //       manager
  //     ),
  //     new Block(
  //       new Vector2(this.rightLimit + this.ballRadius * 4 +  width/2, 0),
  //       new Vector3(width, this.dimmensions.height, width),
  //       BlockType.Score,
  //       new RenderMaterial(RenderMaterialType.colored, colorPalette.roseGarden),
  //       manager
  //     ),
  //     new Block(
  //       new Vector2(0, this.topLimit + width/2),
  //       new Vector3(this.dimmensions.width * 2, width, width),
  //       BlockType.Score,
  //       new RenderMaterial(RenderMaterialType.colored, colorPalette.roseGarden),
  //       manager
  //     ),
  //     new Block(
  //       new Vector2(0, this.bottomLimit - this.ballRadius - width/2),
  //       new Vector3(this.dimmensions.width * 2, width, width),
  //       BlockType.Score,
  //       new RenderMaterial(RenderMaterialType.colored, colorPalette.roseGarden),
  //       manager
  //     ),
  //   ];

  //   //blocks.forEach(block => {
  //   blocks[0].bindEvent(createEventScoreColision(manager, blocks[0], 1));
  //   blocks[1].bindEvent(createEventScoreColision(manager, blocks[1], 0));
  //   blocks[2].bindEvent(createEventScoreColision(manager, blocks[2], 1));
  //   blocks[3].bindEvent(createEventScoreColision(manager, blocks[3], 0));
  //   //})

  //   return blocks;
  // }

  createFancyWalls(manager: Manager): Block[] {
    const blocks = [
      new Block(new Vector2(this.leftLimit * 2/3, this.topLimit + 0.42),
        new Vector3(-(this.leftLimit - this.leftLimit * 2/3) * 2 - this.paddleWidth * 2, 0.3, 0.3),
        BlockType.Collision,
        new RenderMaterial(RenderMaterialType.colored,colorPalette.darkestPurple),
        manager
      ),
      new Block(new Vector2(this.leftLimit * 3.5/6, this.bottomLimit),
        new Vector3(-(this.leftLimit - this.leftLimit * 3.5/6) * 2- this.paddleWidth * 2, 0.2, 0.22),
        BlockType.Collision,
        new RenderMaterial(RenderMaterialType.colored, colorPalette.josefYellow),
        manager
      ),
      new Block(new Vector2(this.rightLimit * 2/3, this.bottomLimit - 0.42),
        new Vector3((this.rightLimit - this.rightLimit * 2/3) * 2 - this.paddleWidth * 2, 0.3, 0.3),
        BlockType.Collision,
        new RenderMaterial(RenderMaterialType.colored,colorPalette.darkestPurple),
        manager
      ),
      new Block(new Vector2(this.rightLimit * 3.5/6, this.topLimit),
        new Vector3((this.rightLimit - this.rightLimit * 3.5/6) * 2 - this.paddleWidth * 2, 0.2, 0.22),
        BlockType.Collision,
        new RenderMaterial(RenderMaterialType.colored, colorPalette.josefYellow),
        manager
      ),
      new Block(new Vector2(-0.042, this.topLimit + 0.21),
        new Vector3(0.7, 0.11, 0.2),
        BlockType.Collision,
        new RenderMaterial(RenderMaterialType.colored,colorPalette.roseGarden),
        manager
      ),
      new Block(new Vector2(+0.042, this.bottomLimit - 0.21),
        new Vector3(0.7, 0.11, 0.2),
        BlockType.Collision,
        new RenderMaterial(RenderMaterialType.colored,colorPalette.roseGarden),
        manager
      ),
    ];
    blocks.forEach(block => {
      block.bindEvent(eventEventWallColision);
      // block.bindEvent();
    })
 
    return  blocks;
  }

  createFancyScoreBlocks(manager: Manager): Block[] {
    const width = 0.42;
    const blocks : Block[] = [
      new Block(
        new Vector2(this.leftLimit - this.ballRadius * 4  - width/2, 0),
        new Vector3(width, this.dimmensions.height * 2, 0.02),
        BlockType.Score,
        new RenderMaterial(RenderMaterialType.colored, colorPalette.black),
        manager
      ),
      new Block(
        new Vector2(this.rightLimit + this.ballRadius +  width/2, 0),
        new Vector3(width, this.dimmensions.height, width),
        BlockType.Score,
        new RenderMaterial(RenderMaterialType.colored, colorPalette.black),
        manager
      ),
      new Block(
        new Vector2(0, this.topLimit + 0.84 + width/2),
        new Vector3(this.dimmensions.width * 2, width, width),
        BlockType.Score,
        new RenderMaterial(RenderMaterialType.colored, colorPalette.black),
        manager
      ),
      new Block(
        new Vector2(0, this.bottomLimit - 0.84 - width/2),
        new Vector3(this.dimmensions.width * 2, width, width),
        BlockType.Score,
        new RenderMaterial(RenderMaterialType.colored, colorPalette.black),
        manager
      ),
    ];

    blocks.forEach(block => {
    blocks[0].bindEvent(createEventScoreColision(manager, blocks[0], 1));
    blocks[1].bindEvent(createEventScoreColision(manager, blocks[1], 0));
    blocks[2].bindEvent(createEventScoreColision(manager, blocks[2], 1));
    blocks[3].bindEvent(createEventScoreColision(manager, blocks[3], 0));
    })

    return blocks;
  }

  createDefaultAdditionalLights(): THREE.Light[] {  
    // <        // Additional lights
//         {
//           const light = new THREE.PointLight(colorPalette.white , this.defaultLightIntensity / 10);
//           light.position.set(-1, -1, -1);
//           this.additionalLights.push(light);
//         }
      const settings = this;
      // Additional lights
      const additionalLights : THREE.Light[] = [];
      {
        const light = new THREE.AmbientLight(colorPalette.white , settings.defaultLightIntensity /10);
        settings.additionalLights.push(light);
      }
      // Additional lights
      {
        const red = 0xFF0000;
        const light = new THREE.DirectionalLight(red , settings.defaultLightIntensity);
        light.position.set(1, 0.1, 0);
        settings.additionalLights.push(light);
      }
      // Additional lights
      {
        const blue = 0x0000FF;
        const light = new THREE.DirectionalLight(blue , settings.defaultLightIntensity);
        light.position.set(-1, -0.1, 0);
        settings.additionalLights.push(light);
      }
      return settings.additionalLights;
  }

  createFancyAdditionalLights(): THREE.Light[] {
    const settings = this;
    //ambient light
    {
      const light = new THREE.AmbientLight(colorPalette.white , settings.defaultLightIntensity / 10);
      settings.additionalLights.push(light);
    }
    // // Additional lights white
    {
      const light = new THREE.PointLight(colorPalette.white , settings.defaultLightIntensity);
      light.position.set(-1, -1, -1);
      settings.additionalLights.push(light);
    }
    // Additional lights (pallette)
    {
      const light = new THREE.PointLight(colorPalette.swingPurple , settings.defaultLightIntensity);
      light.position.set(-1, 1, -1);
      settings.additionalLights.push(light);
    }
    {
      const light = new THREE.PointLight(colorPalette.roseGarden , settings.defaultLightIntensity);
      light.position.set(1, 1, -1);
      settings.additionalLights.push(light);
    }
    {
      const light = new THREE.PointLight(colorPalette.leadCyan , settings.defaultLightIntensity);
      light.position.set(1, -1, -1);
      settings.additionalLights.push(light);
    }
    {
      const light = new THREE.PointLight(colorPalette.white , settings.defaultLightIntensity);
      light.position.set(1, 0, 1);
      settings.additionalLights.push(light);
    }
    {
      const light = new THREE.PointLight(colorPalette.black , settings.defaultLightIntensity);
      light.position.set(-1, 0, 1);
      settings.additionalLights.push(light);
    }
    {
      const light = new THREE.PointLight(colorPalette.josefYellow , settings.defaultLightIntensity);
      light.position.set(0, 1, 1);
      settings.additionalLights.push(light);
    }
    {
      const light = new THREE.PointLight(colorPalette.white , settings.defaultLightIntensity);
      light.position.set(0, -1, 1);
      settings.additionalLights.push(light);
    }
    {
      const light = new THREE.PointLight(colorPalette.darkestPurple , settings.defaultLightIntensity);
      light.position.set(0, 0, -1);
      settings.additionalLights.push(light);
    }
    return settings.additionalLights;
  }

  createInfernoAdditionalLights(): THREE.Light[] {  
    const settings = this;
    //ambient light
    {
      const light = new THREE.AmbientLight(colorPalette.white , settings.defaultLightIntensity /15);
      settings.additionalLights.push(light);
    }
    // Infernal lights
    const additionalLights : THREE.Light[] = [];
    {
      const red = 0xFF0000;
      const light = new THREE.DirectionalLight(red , settings.defaultLightIntensity * 50);
      light.position.set(1, 0.1, 0);
      settings.additionalLights.push(light);
    }
    // fire lights
    {
      const fire = 0xFFA500;
      const light = new THREE.PointLight(fire , settings.defaultLightIntensity * 50);
      const light2 = new THREE.PointLight(fire , settings.defaultLightIntensity * 50);
      light.position.set(-1.5, 0, 0.1);
      light2.position.set(-1.5, 0, -0.1);
      settings.additionalLights.push(light);
    }
    return settings.additionalLights;
  }
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

  // Additional lights
  public readonly additionalLights : THREE.Light[] = [];

  // Ball settings
  // Constructor settings
  public readonly ballRadius! : number;
  public readonly ballColor! : number;
  public readonly ballInitSpeed! : number;
  public readonly ballInitAcceleration! : number;
  public readonly ballInitDir!: Vector2;
  public readonly ballWidthSegments = 32;
  public readonly ballHeightSegments = 16;

  //Ball position
  public readonly ballInitPos = new Vector2(0,0);

  // Ball light settings
  public readonly ballLightIsOn! : boolean;
  public readonly ballLightColor! : number;
  public readonly ballLightIntensity! : number;

  // Paddle settings
  public readonly paddleWidth! : number;
  public readonly paddleHeight! : number;
  public readonly paddleDepth! : number;
  public readonly paddleColor! : number;
  public readonly paddleType! : BlockType;
  public readonly paddleState : PaddleState[] = [PaddleState.Binded, PaddleState.Binded];
  // public readonly paddleState : PaddleState[] = [PaddleState.Binded, PaddleState.Binded, PaddleState.Binded, PaddleState.Binded];

  public readonly paddleUpKey : string[] = ['w', 'o','up', '-'];
  public readonly paddleDownKey : string[] = ['s', 'l','down', '+'];

  // Paddle position
  public readonly leftPaddlePos: Vector2 = new Vector2(-1,0);
  public readonly rightPaddlePos: Vector2 = new Vector2(1,0);
  public readonly paddleInitPos: Vector2[] = [this.leftPaddlePos, this.rightPaddlePos];
  public readonly paddleDimmensions = new Vector3(this.paddleWidth, this.paddleHeight, this.paddleDepth);

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
    this.blocks = blocks;

  }

  createMatchInitUpdate(info : MatchSettings, manager : Manager) : MatchUpdate{
    const paddles : Paddle[] = [];
    for (let i = 0; i < info.teamSize * 2; i++){
      const paddle = new Paddle(this, i,manager)
      //const pos : Vector2 = i < info.teamSize ? this.leftPaddlePos.clone() : this.rightPaddlePos.clone();
      //paddles[i] = new Paddle(this, i, manager);
      //paddle.state = info.initPaddleStates[i];
      //console.log('paddle state before asign', paddle, 'as number', info.initPaddleStates[i])
      if (info.initPaddleStates[i] == PaddleState.Binded){
        console.log('set binded')
        paddle.stateBinded = true;
      }
      else if (info.initPaddleStates[i] == PaddleState.Unbinded){
        console.log('set Unbinded')
        paddle.stateUnbinded = true;
      }
      else if (info.initPaddleStates[i] == PaddleState.Bot){
        console.log('set Bot')
        paddle.stateBot = true;
      }
      console.log('after asign', paddle, 'as number', info.initPaddleStates[i])
      paddle.bindEvent(createEventPaddleColision(this, paddle))
      // paddles[i].bindTick(createTickKeyboardInputPaddle(paddles[i], new Key(paddles[i].upKey ,paddles[i].downKey)))
      //           .bindTick(createTickMove(paddles[i]));
  //    paddles[i].bindTick(createTickUpdate(paddles[i], () => manager.getMatchState()));
      paddle.bindTick(createPaddleUpdate(paddle, manager))
        .bindTick(createTickMove(paddle))
      // if (paddles[i].state === PaddleState.Bot){
      //   paddles[i].bindTick(createTickMove(paddles[i]));
      // }
      // emmm
      paddle.bindEvent(createEventIAprediction(paddle));
      paddles.push(paddle)
    }
    //console.log('paddle state afte FOR', paddles[0].state)
    //console.log('paddles for', paddles)
    const balls : Ball[] = new Array<Ball>(1);
    balls[0] = new Ball(this, manager);
    balls[0].bindTick(createTickMove(balls[0]));
    return new MatchUpdate(paddles, balls,this.blocks!, new Score([0,0]),0);  
  }

  setMatchInitUpdate(update : MatchUpdate, info : MatchSettings){
    for (const [index, paddle] of update.paddles.entries()){
      paddle.pos.copy(index < info.teamSize ? this.leftPaddlePos : this.rightPaddlePos);
      paddle.dimmensions.set(this.paddleWidth, this.paddleHeight, this.paddleDepth);
      paddle.type = BlockType.Collision;
      paddle.color = this.paddleColor;
      paddle.dir.set(0,0);
      paddle.speed = this.paddleSpeed;
    }
    for (const [index, ball] of update.balls.entries()){
      ball.pos.set(0,0);
      ball.speed = this.ballInitSpeed;
      ball.dir.copy(this.ballInitDir);
      ball.lightOn = this.ballLightIsOn;
    }


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
        defaultInfo.ballInitSpeed = 1;
        defaultInfo.additionalLights = defaultInfo.createDefaultAdditionalLights();
        {
          const blocks = [...defaultInfo.createDefaultScoreBlocks(this.manager),  ...defaultInfo.createDefaultWalls(this.manager)];
          this.maps.set(MapsName.Default, new MapSettings(defaultInfo, blocks));
        }
        const infernoInfo = new MapSettingsCreateInfo();
        infernoInfo.ballInitSpeed = defaultInfo.ballInitSpeed * 3;
        infernoInfo.ballColor = colorPalette.roseGarden;
        infernoInfo.ballLightColor = colorPalette.roseGarden;
        infernoInfo.ballLightIntensity = 2;
        infernoInfo.paddleSpeed = defaultInfo.paddleSpeed * 3;
        infernoInfo.ballLightIsOn = true;
        // infernoInfo.ballInitDir = new Vector2(Math.random() * Math.PI / 16,0);
        infernoInfo.additionalLights = infernoInfo.createInfernoAdditionalLights();
        {
          const blocks = [...infernoInfo.createDefaultScoreBlocks(this.manager),  ...infernoInfo.createDefaultWalls(this.manager)];
          this.maps.set(MapsName.Inferno, new MapSettings(infernoInfo, blocks));
        }

        // Create fancy map
        const fancyInfo = new MapSettingsCreateInfo();
        fancyInfo.ballInitSpeed = defaultInfo.ballInitSpeed * 1.4;
        fancyInfo.ballColor = colorPalette.josefYellow;
        fancyInfo.ballLightColor = colorPalette.josefYellow;
        fancyInfo.ballLightIntensity = 2;
        fancyInfo.paddleSpeed = defaultInfo.paddleSpeed * 1.5;
        fancyInfo.ballLightIsOn = false;
        fancyInfo.collisionChangeBallColor = true;
        fancyInfo.collisionChangeWallColor = true;
        fancyInfo.collisionChangePaddleColor = true;
        fancyInfo.additionalLights = fancyInfo.createFancyAdditionalLights();
        {
          const blocks = [...fancyInfo.createFancyScoreBlocks(this.manager),  ...fancyInfo.createFancyWalls(this.manager)];
          this.maps.set(MapsName.Fancy, new MapSettings(fancyInfo, blocks));
        }

    }
    getMapSettings(map: MapsName): MapSettings | undefined {
      return this.maps.get(map);
    }
}