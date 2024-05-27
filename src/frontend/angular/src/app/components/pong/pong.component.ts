import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, Input } from '@angular/core';
import * as THREE from 'three';
import { Vector2, Vector3} from 'three';
import { Subscription } from 'rxjs';
import * as key from 'keymaster';

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
  mesh : THREE.Mesh;
  light! : THREE.PointLight;

  radius : number;
  speed : number;
  aceleration : number;//after a collision
  colorChange : boolean;

  eventBehaviour : EventBehaviour<Ball>;
  tickBehaviour : TickBehaviour<Ball>;
  private id! : number;
  _dir: Vector2 = new Vector2(0,0);
  pos : Vector2;
  lightOn : boolean;

  constructor(settings : MapSettings, manager : Manager) {
    this.radius = settings.ballRadius;
    const widthSegments = settings.ballWidthSegments;
    const heightSegments = settings.ballHeightSegments;
    const ballGeometry = new THREE.SphereGeometry(this.radius, widthSegments, heightSegments);
    const ballColor = settings.ballColor;
    const ballMaterial = new THREE.MeshPhongMaterial({color: ballColor});
    this.mesh = new THREE.Mesh(ballGeometry, ballMaterial);

    this.pos = settings.ballInitPos;
    this.dir = settings.ballInitDir;
    this.speed = settings.ballInitSpeed;
    this.aceleration = settings.ballInitAcceleration;

    this.lightOn = settings.ballLightIsOn;
    if (this.lightOn) {
      const color = ballColor;
      const intensity = settings.ballLightIntensity;
      this.light = new THREE.PointLight( color, intensity );
    }

    this.colorChange = settings.collisionChangeBallColor;

    //this.id = manager.subscribeGameObject(this);
    this.eventBehaviour = new EventBehaviour<Ball>(this, manager);
    this.tickBehaviour = new TickBehaviour<Ball>(this);
  }


  addToScene(scene: THREE.Scene) {
    console.log('adding ball to scene');
    scene.add(this.mesh);
    if (this.lightOn)
      scene.add(this.light);
  }

  sincronize(ball : Ball){
    this.position.set(ball.pos.x, ball.pos.y, 0);
    this.dir = ball.dir;
    this.speed = ball.speed;
  }

  update(timeDelta : number) {
    const ballDiferentialDisplacement = timeDelta * this.speed;
    this.mesh.position.x -= ballDiferentialDisplacement * Math.cos(this.angle);
    this.mesh.position.y -= ballDiferentialDisplacement * Math.sin(this.angle);
    this.light.position.x = this.mesh.position.x;
    this.light.position.y = this.mesh.position.y;
    this.pos.x = this.mesh.position.x;
    this.pos.y = this.mesh.position.y;
  }

  changeColor(color: number) {
    this.mesh.material = new THREE.MeshPhongMaterial({color: color});
    if (this.lightOn)
      this.light.color = new THREE.Color(color);
  }

  yCollision(y: number) {// y is the ideal position of the ball when it collides
    this.dir.y = -this.dir.y;
    this.pos.y = y;
    this.speed += this.aceleration * this.speed;
    if (this.colorChange)
      this.changeColor(Math.random() * 0xFFFFFF);
  }

  xCollision(x: number) {// x is the ideal position of the ball when it collides
    this.dir.x = -this.dir.x;
    this.pos.x = x;
    this.speed += this.aceleration * this.speed;
    if (this.colorChange)
      this.changeColor(Math.random() * 0xFFFFFF);
  }

  toJSON(): any {
    const {pos, speed, dir} = this;
    return {pos, speed, dir}; 
    
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

  get position() : Vector3{
    return this.mesh.position;
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

  set position(value : Vector3){
    this.mesh.position.copy(value);
    this.light.position.copy(value);
    this.pos.x = value.x;
    this.pos.y = value.y;
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
  mesh : THREE.Mesh;
  speed : number;
  friction : number;
  deltaFactor : number;
  height : number;
  width : number;
  upKey! : string;
  downKey! : string;
  goinUp : boolean = false;
  goinDown : boolean = false;
  localPlayer : boolean = false;
  AIplayer : boolean = false;
  AIprediction : number = 0;

  tickBehaviour : TickBehaviour<Paddle>;
  eventBehaviour : EventBehaviour<Paddle>;
  id! : number;
  pos : Vector2;
  dir : Vector2 = new Vector2(0,0);
  dimmensions : Vector3;
  type : BlockType;
  color : number;
  state : PaddleState;

  constructor(settings : MapSettings, number : number,manager: Manager){
    this.width = settings.paddleWidth;
    this.height = settings.paddleHeight;
    const paddleDepth = settings.paddleDepth;
    const paddleGeometry = new THREE.BoxGeometry(this.width, this.height, paddleDepth);
    const paddleColor = settings.paddleColor;
    const paddleMaterial = new THREE.MeshPhongMaterial({color: paddleColor});
    this.mesh = new THREE.Mesh(paddleGeometry, paddleMaterial);

    this.speed = settings.paddleSpeed;
    this.friction = settings.friction;
    this.deltaFactor = settings.deltaFactor;


    //this.id = manager.subscribeGameObject(this);
    this.tickBehaviour = new TickBehaviour<Paddle>(this);
    this.eventBehaviour = new EventBehaviour<Paddle>(this, manager);
    this.pos = settings.paddleInitPos[number];
    this.dimmensions = settings.paddleDimmensions;
    this.type = settings.paddleType;
    this.color = settings.paddleColor;
    this.speed = settings.paddleSpeed;
    this.state = settings.paddleState[number];
  }

  addToScene(scene: THREE.Scene) {
    scene.add(this.mesh);
  }

  sincronize(paddle : Paddle){
    this.position.set(paddle.pos.x, paddle.pos.y, 0);
    this.dir = paddle.dir;
  }

  handleKey() {
    if (key.isPressed(this.upKey)) {
      this.goinUp = true;
    }
    else {
      this.goinUp = false;
    }
    if (key.isPressed(this.downKey)) {
      this.goinDown = true;
    }
    else {
      this.goinDown = false;
    }
  }

  handleIA() {
    if (this.pos.y < this.AIprediction - this.width / 42) {
      this.goinUp = true;
      this.goinDown = false;
    }
    else if (this.pos.y > this.AIprediction + this.width / 42) {
      this.goinUp = false;
      this.goinDown = true;
    }
    else {
      this.goinUp = false;
      this.goinDown = false;
    }
  }

  update(timeDelta : number) {
    if (this.localPlayer) {
      this.handleKey();
    }
    if (this.AIplayer) {
      this.handleIA();
    }
    const paddleDiferentialDisplacement = timeDelta * this.speed;
    if (this.goinUp) {
      this.pos.y += paddleDiferentialDisplacement;
    }
    if (this.goinDown) {
      this.pos.y -= paddleDiferentialDisplacement;
    }
  }

  changeColor(color: number) {
    this.mesh.material = new THREE.MeshPhongMaterial({color: color});
  }

  limitYmax(maxY: number) {
    if (this.pos.y > maxY) {
      this.pos.y = maxY;
    }
  }

  limitYmin(minY: number) {
    if (this.pos.y < minY) {
      this.pos.y = minY;
    }
  }

  madeLocalPlayer() {
    this.localPlayer = true;
    this.AIplayer = false;
  }

  madeAIPlayer() {
    this.localPlayer = false;
    this.AIplayer = true;
  }

  toJSON() : any{
    const {pos, dimmensions,type, color, speed, dir} = this;
    return {pos, dimmensions,type, color, speed, dir}; 
  }
  getId(): number {
    return this.id;
  }

  get position() : Vector3{
    return this.mesh.position;
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
  balls: Ball[] = [];
  ballsLight: THREE.Light[] = [];
  blocks: THREE.Mesh[] = [];//0 is top 1 is bottom
  paddles: Paddle[] = [];
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
    // const numberOfBalls = this.map.numberOfBalls;
    const numberOfBalls = 1;
    for (let i = 0; i < numberOfBalls ; i++) {
      const ball = new Ball(this.map, this.manager);
      ball.addToScene(this.scene);
      this.balls.push(ball);
    }

    // INIT PADDLES
    this.paddles = new Array<Paddle>(this.update.paddles.length);
    for (const [index, paddle] of this.update.paddles.entries()){
      const paddleGeometry = new THREE.BoxGeometry(
        paddle.dimmensions.x,
        paddle.dimmensions.y,
        paddle.dimmensions.z
      );
      const paddleMaterial = new THREE.MeshPhongMaterial({ color: paddle.color });
      this.paddles[index] = new Paddle(this.map, index, this.manager);
      this.paddles[index].addToScene(this.scene);
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
      this.balls[index].sincronize(ball);
    }
    for (const [index, paddle] of this.update.paddles.entries()){
      this.paddles[index].sincronize(paddle);
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
