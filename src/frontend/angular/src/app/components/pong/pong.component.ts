import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, Input } from '@angular/core';
import * as THREE from 'three';
import { Vector2, Vector3} from 'three';
import { Subscription } from 'rxjs';


import {GameManagerService, GameManagerState, Manager, MatchSettings, MatchState, MatchUpdate } from '../../services/gameManager.service';
import { Router } from '@angular/router';

import { TickBehaviour, EventBehaviour, tickBehaviourAccelerate, EventObject, PongEventType, EventData, TickObject } from '../../utils/behaviour';
import { MapSettings } from '../../services/map.service';

export const colorPalette = {
  darkestPurple: 0x1C0658,
  swingPurple: 0x5C2686,
  roseGarden: 0xFF1690,
  josefYellow: 0xF4D676,
  leadCyan: 0x36CDC4,
  white: 0xFFFFFF,
  black: 0x000000,
};

/*class Light{
  const color = this.map.defaultlightColor;
  const intensity = this.map.defaultLightIntensity;
  const light = new THREE.DirectionalLight(color, intensity);
  const X = this.map.defaultLightPositionX;
  const Y = this.map.defaultLightPositionY;
  const Z = this.map.defaultLightPositionZ;
  light.position.set(X, Y, Z);

  constructor(color, intensity, ){

  }
}*/

export enum PaddleState{
  Binded = 'binded', //must be keybinded moved by ourselfs
  Unbinded = 'unbinded',
  Bot = 'bot'
}

export enum BlockType{
  Score = 'score',
  Collision = 'collision',
  Death = 'death'
}

export interface toJson{
  toJSON() : any;
}

export interface GameObject{
  getId() : number;
}

export class Ball implements GameObject, EventObject,  TickObject, toJson{
  eventBehaviour : EventBehaviour<Ball>;
  tickBehaviour : TickBehaviour<Ball>;
  private id! : number;
  _dir: Vector2 = new Vector2(0,0);
  speed: number;
  pos : Vector2;
  lightOn : boolean;
  lightColor : number;
  lightIntensity : number;

  constructor(dir: Vector2, speed: number, lightOn : boolean, pos : Vector2,
    lightColor : number, lightIntensity : number, manager : Manager) {
    //this.id = manager.subscribeGameObject(this);
    this.dir = dir;
    this.speed = speed;
    this.eventBehaviour = new EventBehaviour<Ball>(this, manager);
    this.tickBehaviour = new TickBehaviour<Ball>(this);
    this.pos = pos;
    this.lightOn = lightOn;
    this.lightColor = lightColor;
    this.lightIntensity = lightIntensity; 
  }

  toJSON(): any {
    const {pos, speed, dir, lightColor, lightIntensity, lightOn} = this;
    return {pos, speed, dir, lightColor, lightIntensity, lightOn}; 
    
  }
  runEvent(type: PongEventType, data : EventData): void {
    this.eventBehaviour.runEvent(type, data);
  }

  runTick(delta: number): void {
    this.tickBehaviour.runTick(delta);
  }

  getId() : number{
    return this.id;
  }
  get dir() : Vector2{
    return this._dir;
  }

  get dirX() : number{
    return this.dir.x;
  }

  get dirY() : number{
    return this.dir.y;
  }

  get dirVector() : Vector2{
    return new Vector2(this.dir.x, this.dir.y);
  }

  get angle() : number{//medido desde la derecha
    return Math.atan2(this.dir.y, this.dir.x);
  }

  set dirX(value : number){
    this.dir.x = value;
  }

  set dirY(value : number){
    this.dir.y = value;
  }

  set dir(value : Vector2){
    this._dir = value;
  }

  subscribeToManager(manager : Manager): void {
    this.id = manager.subscribeGameObject(this);
    this.eventBehaviour.subscribeToManager(manager);
  }
  bindEvent(fn: any): EventObject {
    return this.eventBehaviour.bindEvent(fn);
  }
  bindTick(fn: any): TickObject {
    return this.tickBehaviour.bindTick(fn);
  }
}

export enum RenderMaterialType{
  transparent,
  colored
}

export class RenderMaterial{
  type : RenderMaterialType;
  color? : number | undefined;

  constructor(type : RenderMaterialType, color : number | undefined = undefined){
    this.type = type;
    this.color = color;
  }
}

export class Block implements GameObject, EventObject, TickObject, toJson{
  tickBehaviour : TickBehaviour<Block>;
  eventBehaviour : EventBehaviour<Block>;
  
  id! : number;
  
  type : BlockType;

  pos : Vector2;
  speed : number;
  dimmensions : Vector3;
  material : RenderMaterial;

  constructor(pos : Vector2, dimmensions : Vector3, type : BlockType, material : RenderMaterial, manager : Manager){
    //this.id = manager.subscribeGameObject(this);
    this.tickBehaviour = new TickBehaviour<Block>(this);
    const accelarate = tickBehaviourAccelerate(10);//example
    this.tickBehaviour.bindTick(accelarate);
    this.eventBehaviour = new EventBehaviour<Block>(this, manager);
    this.pos = pos;
    this.dimmensions = dimmensions;
    this.type = type;
    this.material = material;
    this.speed = 0;
  }
  toJSON(): any {
    const { pos, dimmensions, type, speed, material } = this;
    return { pos, dimmensions, type, speed, material };  
  }
  getId() : number{
    return this.id;
  }
  
  runEvent(type: PongEventType, data: EventData): void {
    this.eventBehaviour.runEvent(type, data);
  }

  runTick(delta: number): void {
    this.tickBehaviour.runTick(delta);
  }

  subscribeToManager(manager:  Manager): void {
    this.id = manager.subscribeGameObject(this);
    this.eventBehaviour.subscribeToManager(manager);
  }

  bindEvent(fn: any): EventObject {
    return this.eventBehaviour.bindEvent(fn);
  }
  bindTick(fn: any): TickObject {
    return this.tickBehaviour.bindTick(fn);
  }

}


export class Paddle implements GameObject, EventObject, TickObject, toJson{
  tickBehaviour : TickBehaviour<Paddle>;
  eventBehaviour : EventBehaviour<Paddle>;
  id! : number;
  pos : Vector2;
  dir : Vector2;
  dimmensions : Vector3;
  type : BlockType;
  color : number;
  speed : number;
  state : PaddleState;

  constructor(pos : Vector2, dimmensions : Vector3, type : BlockType, color : number, dir : Vector2, speed : number, state : PaddleState, manager : Manager){
    //this.id = manager.subscribeGameObject(this);
    this.tickBehaviour = new TickBehaviour<Paddle>(this);
    this.eventBehaviour = new EventBehaviour<Paddle>(this, manager);
    this.pos = pos;
    this.dimmensions = dimmensions;
    this.type = type;
    this.color = color;
    this.speed = speed;
    this.state = state;
    this.dir = dir;
  }
  toJSON() : any{
    const {pos, dimmensions,type, color, speed, dir} = this;
    return {pos, dimmensions,type, color, speed, dir}; 
  }

  getId(): number {
    return this.id;
  }

  runEvent(type: PongEventType, data: EventData): void {
    this.eventBehaviour.runEvent(type, data);
  }

  runTick(delta: number): void {
    this.tickBehaviour.runTick(delta);
  }

  subscribeToManager(manager : Manager): void {
    this.id = manager.subscribeGameObject(this);
    this.eventBehaviour.subscribeToManager(manager);
  }

  bindEvent(fn: any): EventObject {
    return this.eventBehaviour.bindEvent(fn);
  }

  bindTick(fn: any): TickObject {
    return this.tickBehaviour.bindTick(fn);
  }

}

@Component({
  selector: 'app-pong',
  standalone: true,
  templateUrl: './pong.component.html',
  styleUrls: ['./pong.component.css']
})
export class PongComponent implements AfterViewInit, OnDestroy {

  @ViewChild('pongCanvas', { static: true }) pongCanvas!: ElementRef<HTMLCanvasElement>;

  public readonly fov = 75;
  public readonly aspect = 2; // the canvas default
  public readonly near = 0.1;
  public readonly far = 5;
  public readonly cameraZ = 2;

  stop : boolean = false;
  renderer!: THREE.WebGLRenderer;
  canvas: any;
  camera!: THREE.PerspectiveCamera;
  scene!: THREE.Scene;
  light!: THREE.Light;
  balls: THREE.Mesh[] = [];
  ballsLight: THREE.Light[] = [];
  blocks: THREE.Mesh[] = [];//0 is top 1 is bottom
  paddles: THREE.Mesh[] = [];
  pastTime: number = 0;
  lastUpdate: number = 0;
  currentMatchStateId = 0;
  @Input() map!: MapSettings;
  @Input() matchSettings!: MatchSettings;
  @Input() update!: MatchUpdate;

  //currentGame!: MatchGame;//it should always exist when a game starts, even if not at construction

  configStateSubscription!: Subscription;

  constructor(private manager: GameManagerService,
    private router: Router) {
  }

  ngAfterViewInit(): void {
    if (this.manager.getState() === GameManagerState.Standby) {
      console.error('pong, no game has been started');
      this.router.navigate(['/']);
    }
    this.initValues()
    this.configStateSubscription = this.manager.subscribeMatchState(//it was done befor it was set??
      (state: MatchState) => {
        switch (state) {
          case MatchState.Initialized:
            break;
          case MatchState.Running:
            console.log('MATCH STARTING')
            this.run();
            break;
          case MatchState.Paused:
            this.pause();
            break;
          case MatchState.FinishedSuccess:
            break;
          case MatchState.Error:
            this.pause();
            break;
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.configStateSubscription.unsubscribe()
    // Dispose renderer if exists
    if (this.renderer) {
      this.renderer.dispose();
      this.stop = true;
    }

    // Clear scene
    if (this.scene) {
      while (this.scene.children.length > 0) {
        this.scene.remove(this.scene.children[0]);
      }
    }
    //this.manager.setMatchState(MatchState.FinishedSuccess);
  }

  getScore() : string{
    if (this.matchSettings === undefined)
      return 'undefined'
    else
      return `${this.update.score.score[0]} : ${this.update.score.score[1]}`
  }

  run() {//should work for both resume and initial run

    if (this.renderer) {
      requestAnimationFrame(this.render.bind(this));
      // this.renderer.setAnimationLoop(this.render.bind(this));//!todo better use matute method
      
    }
  }

  pause() {
    if (this.renderer) {
      this.renderer.setAnimationLoop(null);//!todo
      
    }
  }

  initScene(){
    // INIT SCENE
    this.scene = new THREE.Scene();

    // INIT DEFAULT LIGHT
    if (this.map.defaultLightingIsOn) {
      this.light = new THREE.DirectionalLight(this.map.defaultlightColor,
        this.map.defaultLightIntensity);
      this.light.position.set(this.map.defaultLightPositionX,
        this.map.defaultLightPositionY,
        this.map.defaultLightPositionZ);
      this.scene.add(this.light);
    }

    // INIT BALL !TODO more than one ball
    const ballGeometry = new THREE.SphereGeometry(this.map.ballRadius,
      this.map.ballWidthSegments,
      this.map.ballHeightSegments);
    const ballMaterial = new THREE.MeshPhongMaterial({ color: this.map.ballColor });
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    this.balls.push(ball);
    this.scene.add(ball);

    // INIT BALL LIGHT
    const ballLight = new THREE.PointLight(this.map.ballLightColor,
      this.map.ballLightIntensity);
    this.ballsLight.push(ballLight);
    this.scene.add(ballLight);

    // INIT PADDLES
    this.paddles = new Array<THREE.Mesh>(this.update.paddles.length);
    for (const [index, paddle] of this.update.paddles.entries()){
      const paddleGeometry = new THREE.BoxGeometry(
        paddle.dimmensions.x,
        paddle.dimmensions.y,
        paddle.dimmensions.z
      );
      const paddleMaterial = new THREE.MeshPhongMaterial({ color: paddle.color });
      this.paddles[index] = new THREE.Mesh(paddleGeometry, paddleMaterial);
      this.scene.add(this.paddles[index]);
    }
    // INIT BLOCKS
    this.blocks = new Array<THREE.Mesh>(this.update.blocks.length);
    for (const [index, block] of this.update.blocks.entries()){
      const blockGeometry = new THREE.BoxGeometry(
        block.dimmensions.x,
        block.dimmensions.y,
        block.dimmensions.z
      );
      let blockMaterial : THREE.MeshPhongMaterial;
      if (block.material.type === RenderMaterialType.transparent)
        blockMaterial = new THREE.MeshPhongMaterial({color : 0x00ff00, transparent : true})
      else
        blockMaterial = new THREE.MeshPhongMaterial({ color: block.material.color });
      this.blocks[index] = new THREE.Mesh(blockGeometry, blockMaterial);
      this.scene.add(this.blocks[index]);
    }
    this.updateScene();
    this.manager.setMatchState(MatchState.Initialized);

  }

  initValues() {
    /*this.map = this.manager.getMapSettings();
    this.matchSettings = this.manager.getMatchSettings();
    this.update = this.manager.getMatchUpdate();//its a reference*/
    //INITIALIZE THREE.JS
    // INIT SCENE
    this.canvas = this.pongCanvas.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas: this.canvas });

    this.camera = new THREE.PerspectiveCamera(this.fov,
      this.aspect,
      this.near,
      this.far);
    this.camera.position.z = this.cameraZ;
    this.initScene();
  }

  

  render(time: number) {
    time *= 0.001; // convert time to seconds
    let pastIATime = 0;
    let predictedBallY = 0;

    if (this.pastTime === 0)
      this.pastTime = time - 0.001;
    const timeDifference = time - this.pastTime;
    this.lastUpdate += timeDifference;

    let before = Date.now()
    this.logic(timeDifference);
    let after = Date.now();
    if (after - before > 3)
      console.error('logic', after - before)
    before = after;
    this.renderer.render(this.scene, this.camera);
    after = Date.now();
    if (after - before > 3)
      console.error('rende', after - before)
    this.pastTime = time;
    if (!this.stop)
      requestAnimationFrame(this.render.bind(this));
  }

  logic(timeDifference : number){ 
    this.update.runTickBehaviour(timeDifference);
    this.allColisions();
    this.updateScene();
  }

  allColisions(){
    let pos1 : Vector2 = new Vector2(0,0);
    let pos2 : Vector2 = new Vector2(0,0);
    let dimmension : Vector2 = new Vector2(0,0);
    for (let ballIndex = 0; ballIndex < this.balls.length; ballIndex++) {
      const ball = this.update.balls[ballIndex];
      for (let paddlesIndex = 0; paddlesIndex < this.paddles.length; paddlesIndex++) {
        const paddle = this.update.paddles[paddlesIndex];
        const intersection: [boolean, {pos : Vector2, normal : Vector2} | undefined] =
          this.circleRectangleIntersection(
            pos1.set(ball.pos.x, ball.pos.y),
            this.map.ballRadius,
            pos2.set(paddle.pos.x, paddle.pos.y),
            dimmension.set(paddle.dimmensions.x, paddle.dimmensions.y));          //todo!
        if (intersection[0]) {
          if (intersection[1] === undefined) {
            console.error('intersection but no data received');
            continue;
          }
          const eventData : EventData = {
            senderId : ball.getId(),
            targetIds : paddle.getId(),
            custom : {
              others : {
                intersection : intersection[1],
              },
              gameObjects:{
                ball : ball
              }
            }
          };
          this.manager.sendEvent(PongEventType.Colision, eventData);
          return;
        }
      }
      for (let blockIndex = 0; blockIndex < this.blocks.length; blockIndex++) {
        const block = this.update.blocks[blockIndex];
        const intersection: [boolean, {pos : Vector2, normal : Vector2} | undefined] =
          this.circleRectangleIntersection(
            pos1.set(ball.pos.x, ball.pos.y),
            this.map.ballRadius,
            pos2.set(block.pos.x, block.pos.y),
            dimmension.set(block.dimmensions.x, block.dimmensions.y)
          );
        //todo!
        if (intersection[0]) {
          if (intersection[1] === undefined) {
            console.error('intersection but no data received');
            continue;
          }
          const eventData : EventData = {
            senderId : ball.getId(),
            targetIds : block.getId(),
            custom : {
              gameObjects : {
                ball : ball
              },
              others : {
                intersection : intersection[1],
              }
            },
          };
          this.manager.sendEvent(PongEventType.Colision, eventData);
//          console.log('sending event COLISION');
        }
      }
    }
  }

  circleRectangleIntersection(circlePos: THREE.Vector2, circleRadious: number,
    rectPos: THREE.Vector2, rectDimmensions: THREE.Vector2): [boolean, {pos : Vector2, normal : Vector2} | undefined] {

    const pos: THREE.Vector2 = new THREE.Vector2(circlePos.x, circlePos.y);
    const normal: Vector2 = new Vector2(0, 0);
    if (circlePos.x < rectPos.x - rectDimmensions.x / 2) {
      pos.x = rectPos.x - rectDimmensions.x / 2;
      normal.x = -1;
    }
    else {
      if (circlePos.x > rectPos.x + rectDimmensions.x / 2) {
        pos.x = rectPos.x + rectDimmensions.width / 2;
        normal.x = 1;
      }
    }
    if (circlePos.y < rectPos.y - rectDimmensions.y / 2) {
      pos.y = rectPos.y - rectDimmensions.y / 2;
      normal.y = -1;
    }
    else {
      if (circlePos.y > rectPos.y + rectDimmensions.y / 2) {
        pos.y = rectPos.y + rectDimmensions.y / 2;
        normal.y = 1;
      }
    }
    const distance = pos.distanceTo(circlePos);
    if (distance <= circleRadious)
      return [true, {pos, normal}];
    return [false, undefined];
  }

  updateScene(){//there should be a variable telling if it was changed
    for (const [index, ball] of this.update.balls.entries()){
      this.balls[index].position.set(ball.pos.x, ball.pos.y, 0);
      if (ball.lightOn)
        this.ballsLight[index].position.set(ball.pos.x, ball.pos.y, 0);
    }
    for (const [index, paddle] of this.update.paddles.entries()){
      this.paddles[index].position.set(paddle.pos.x, paddle.pos.y,0);
      //this.paddles[index].material = new THREE.MeshPhongMaterial({ color: paddle.color });
    }
    for (const [index, block] of this.update.blocks.entries()){
      this.blocks[index].position.set(block.pos.x, block.pos.y, 0);
      //his.blocks[index].material = new THREE.MeshPhongMaterial({ color: block.material.color });
    }
  }

  /* !MANAGED BY THE MANAGER BY ITSELF
  sendUpdate() {
    const paddlesPosition = this.paddles.map(paddle => paddle.mesh.position.y);
    const ballsPosition = this.balls.map(ball => new Vector2(ball.mesh.position.x, ball.mesh.position.y));
    const ballsDir = this.balls.map(ball => ball.dir);
    const ballsSpeed = this.balls.map(ball => ball.speed);
    const update = new MatchUpdate(paddlesPosition, undefined, ballsPosition, ballsDir, ballsSpeed, this.currentMatchStateId, this.matchmakingService.currentMatchInfo!);
    this.matchmakingService.sendMatchUpdate(update);
    this.currentMatchStateId += 1;
  }
  */
}