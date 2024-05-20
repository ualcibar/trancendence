import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import * as key from 'keymaster'; // Si estás utilizando TypeScript
import { Vector2 } from 'three';
import { Subscription } from 'rxjs';


import { MatchInfo, MatchUpdate, MatchmakingService } from '../../services/matchmaking.service';
import {GameManagerService, GameManagerState, Manager, MatchState } from '../../services/game-config.service';
import { Router } from '@angular/router';

import { TickBehaviour, EventBehaviour, tickBehaviourAccelerate, EventObject, PongEventType, EventData } from '../../utils/behaviour';
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

class RenderRectangle {
  dimmensions: Vector2;

  constructor(dimmensions: THREE.Vector2, mesh: THREE.Mesh) {
    this.dimmensions = dimmensions;
  }
}
export enum PaddleState{
  Binded = 'binded', //must be keybinded moved by ourselfs
  Unbinded = 'unbinded',
  Bot = 'bot'
}

export enum WallType{
  Score = 'score',
  Collision = 'collision',
  Death = 'death'
}

export class Ball implements EventObject {
  eventBehaviour : EventBehaviour<Ball>;
  tickBehaviour : TickBehaviour<Ball>;
  dir: Vector2;
  speed: number;
  pos : Vector2;
  lightOn : boolean;
  lightColor : number;
  lightIntensity : number;

  constructor(dir: Vector2, speed: number, lightOn : boolean, pos : Vector2,
    lightColor : number, lightIntensity : number, manager : Manager) {
    this.dir = dir;
    this.speed = speed;
    this.eventBehaviour = new EventBehaviour<Ball>(this, manager);
    this.tickBehaviour = new TickBehaviour<Ball>(this);
    this.pos = pos;
    this.lightOn = lightOn;
    this.lightColor = lightColor;
    this.lightIntensity = lightIntensity; 
  }

  runEvent(type: PongEventType, data : EventData): void {
    this.eventBehaviour.runEvent(type, data);
  }

  getId() : number{
    return this.eventBehaviour.getId();
  }
}

export class Block implements EventObject{
  tickBehaviour : TickBehaviour<Block>;
  eventBehaviour : EventBehaviour<Block>;
  pos : Vector2;
  dimmensions : Vector2;
  type : WallType;
  color : number;
  speed : number;

  constructor(pos : Vector2, dimmensions : Vector2, type : WallType, color : number, manager : Manager){
    this.tickBehaviour = new TickBehaviour<Block>(this);
    const accelarate = tickBehaviourAccelerate(10);//example
    this.tickBehaviour.bind(accelarate);
    this.eventBehaviour = new EventBehaviour<Block>(this, manager);
    this.pos = pos;
    this.dimmensions = dimmensions;
    this.type = type;
    this.color = color;
    this.speed = 0;
  }
  getId() : number{
    return this.eventBehaviour.getId();
  }
  
  runEvent(type: PongEventType, data: EventData): void {
    this.eventBehaviour.runEvent(type, data);
  }

}


export class Paddle implements EventObject{
  tickBehaviour : TickBehaviour<Paddle>;
  eventBehaviour : EventBehaviour<Paddle>;
  pos : Vector2;
  dimmensions : Vector2;
  type : WallType;
  color : number;
  speed : number;

  constructor(pos : Vector2, dimmensions : Vector2, type : WallType, color : number, behaiviour : any, manager : Manager){
    this.tickBehaviour = new TickBehaviour<Paddle>(this);
    this.eventBehaviour = new EventBehaviour<Paddle>(this, manager);
    this.pos = pos;
    this.dimmensions = dimmensions;
    this.type = type;
    this.color = color;
    this.speed = 0;
  }

  getId(): number {
    return this.eventBehaviour.getId();
  }

  runEvent(type: PongEventType, data: EventData): void {
    this.eventBehaviour.runEvent(type, data);
  }

}

@Component({
  selector: 'app-pong',
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


  running: boolean = false;
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
  map!: MapSettings;
  info!: MatchInfo;
  update!: MatchUpdate;

  //currentGame!: MatchGame;//it should always exist when a game starts, even if not at construction

  configStateSubscription!: Subscription;

  constructor(private matchmakingService: MatchmakingService, private manager: GameManagerService,
    private router: Router) {
  }

  ngAfterViewInit(): void {
    if (this.manager.getState() === GameManagerState.Standby) {
      console.error('pong, no game has been started');
      this.router.navigate(['/']);
    }
    this.configStateSubscription = this.manager.subscribeMatchState(
      (state: MatchState) => {
        switch (state) {
          case MatchState.Starting:
            this.initValues();
            break;
          case MatchState.Initialized:
            break;
          case MatchState.Running:
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
    if (this.renderer) {
      this.renderer.setAnimationLoop(null);
      this.running = false;
    }
  }

  run() {//should work for both resume and initial run
    if (this.renderer) {
      this.renderer.setAnimationLoop(this.render.bind(this));//!todo better use matute method
      this.running = true;
    }
  }

  pause() {
    if (this.renderer) {
      this.renderer.setAnimationLoop(null);//!todo
      this.running = false;
    }
  }

  initValues() {
    this.map = this.manager.getConfig().settings;
    this.info = this.manager.getConfig().info;
    this.update = this.manager.getMatchUpdate();//its a reference
    //INITIALIZE THREE.JS
    // INIT SCENE
    this.canvas = this.pongCanvas.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas: this.canvas });

    this.camera = new THREE.PerspectiveCamera(this.fov,
      this.aspect,
      this.near,
      this.far);
    this.camera.position.z = this.cameraZ;

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
    const paddleGeometry = new THREE.BoxGeometry(this.map.paddleWidth,
      this.map.paddleHeight,
      this.map.paddleDepth);
    const paddleMaterial = new THREE.MeshPhongMaterial({ color: this.map.paddleColor });

    for (let i = 0; i < this.info.teamSize * 2; i++) {
      const paddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
      this.paddles.push(paddle);
      this.scene.add(paddle);
    }
    this.updateScene();
    /*    !TODO walls will be passed as an array, disigned beforehand
                there will no longer be top bottom just walls
    
    const wallGeometry = new THREE.BoxGeometry(this.map.wallWidth,
                                               this.map.wallHeight,
                                               this.map.wallDepth);
    const wallMaterial = new THREE.MeshPhongMaterial({color: this.map.wallColor});

    const wallDimmensions = new THREE.Vector2(this.map.wallWidth, this.map.wallHeight) 
    
    const topWall = new THREE.Mesh(wallGeometry, wallMaterial);
    topWall.position.x = this.map.topWall.x;
    topWall.position.y = this.map.topWall.y;
    topWall.position.z = this.map.topWall.z;
    
    const bottomWall = new THREE.Mesh(wallGeometry, wallMaterial);
    bottomWall.position.x = this.map.bottomWall.x;
    bottomWall.position.y = this.map.bottomWall.y;
    bottomWall.position.z = this.map.bottomWall.z;
    
    this.scene.add(topWall);
    this.scene.add(bottomWall);
    this.walls.push(new RenderRectangle(wallDimmensions, topWall));
    this.walls.push(new RenderRectangle(wallDimmensions, bottomWall));
    */
    this.manager.setMatchState(MatchState.Initialized);
  }

  

  render(time: number) {
    time *= 0.001; // convert time to seconds

    let pastIATime = 0;
    let predictedBallY = 0;

    // DISPLAY TIME
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    const timeElement = document.getElementById('time');
    if (timeElement) {
      timeElement.innerText = `${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s `;
    }

    if (this.pastTime === 0)
      this.pastTime = time - 0.001;
    const timeDifference = time - this.pastTime;
    this.lastUpdate += timeDifference;

    // MOVE BALL
    /* !TODO 
      if (this.manager.online
        && !this.manager.host && this.matchmakingService.currentMatch!.update.id != this.currentMatchStateId) {
        this.updateGame();
      }
      we will abstract the online part away using the managers, both send and receive
    */

    for (const ball of this.update.balls){
      const ballDiferentialDisplacement = timeDifference * ball.speed;
      ball.pos.add(ball.dir.clone().multiplyScalar(ballDiferentialDisplacement));
    }


    // HANDLE PADDLE MOVEMENT
    const pseudoLimit = 1 - this.map.ballRadius;
    const paddleDiferentialDisplacement = timeDifference * this.map.paddleSpeed;

    // PADDLES MOVEMENT
    /* !TODO
    manager should tell which paddle are binded to which keys, and which ones should we
    check, BOT or ONLINE, at the end it should be a simple array to iterate over
    for (let i = 0; i < this.info.teamSize; i++) {
      const paddle = this.paddles[i];
      if (key.isPressed(this.manager.keys[i].up)) {
        // console.log('key pressed', i, paddle.mesh.position.y);
        paddle.mesh.position.y -= paddleDiferentialDisplacement;
        // console.log('key pressed', i, this.paddles[i].mesh.position.y);
        //if (paddle.mesh.position.y > this.walls[0].mesh.position.y)
        // paddle.mesh.position.y = this.walls[0].mesh.position.y - paddle.mesh.position.y;
      }
      if (key.isPressed(this.manager.keys[i].down)) {
        //   console.log('key pressed');
        paddle.mesh.position.y += paddleDiferentialDisplacement;
        // if (paddle.mesh.position.y < this.walls[1].mesh.position.y)
        //  paddle.mesh.position.y = this.walls[1].mesh.position.y - paddle.mesh.position.y;
      }
    }
    
    if (!this.manager.online) {
      for (let i = this.conf.settings.gameSettings.teamSize; i < this.conf.settings.gameSettings.teamSize * 2; i++) {
        const paddle = this.paddles[i];
        if (key.isPressed(this.manager.keys[i].up)) {
          paddle.mesh.position.y += paddleDiferentialDisplacement;
        }
        if (key.isPressed(this.manager.keys[i].down)) {
          paddle.mesh.position.y -= paddleDiferentialDisplacement;
        }
      }
    }
    */
    /*
    if (key.isPressed('up') || key.isPressed('left')) {
      rightPaddleMovement = paddleDiferentialDisplacement;
    }
    else if (key.isPressed('down') || key.isPressed('right')) {
      rightPaddleMovement = - paddleDiferentialDisplacement;
    }
*/
    // RIGHT PADDLE MOVEMENT
    /*
    if (IA) {
      if (time - pastIATime > 1) { // IA only sees the ball every second
        console.log('IA');
        pastIATime = time;

          // IA PREDICTION
          predictedBallY = ball.position.y +(Math.tan(ballAngle - Math.PI) * (rightPaddle.position.x - ball.position.x));
          while (predictedBallY > pseudoLimit) {
            predictedBallY = pseudoLimit - (predictedBallY - pseudoLimit);
          }
          while (predictedBallY < -pseudoLimit) {
            predictedBallY = -pseudoLimit - (predictedBallY + pseudoLimit);
          }
          predictedBallY  += (Math.random() - Math.random()) * (paddleWidth - radius)/2 ;
          if (ballAngle < Math.PI / 2 || ballAngle > 3 * Math.PI / 2) {
            predictedBallY = (predictedBallY + leftPaddle.position.y) / 2;
          }
        }

      if (rightPaddle.position.y < predictedBallY - paddleWidth / 42) {
        rightPaddleMovement = paddleDiferentialDisplacement;
      }
      else if (rightPaddle.position.y > predictedBallY + paddleWidth / 42) {
        rightPaddleMovement = - paddleDiferentialDisplacement;
      }
      else {
        rightPaddleMovement = 0;
      }
    }
    else {
      if (key.isPressed('up') || key.isPressed('left')) {
        rightPaddleMovement = paddleDiferentialDisplacement;
      }
      else if (key.isPressed('down') || key.isPressed('right')) {
        rightPaddleMovement = - paddleDiferentialDisplacement;
      }
      else {
        rightPaddleMovement = 0;
      }
    }*/

    // MOVE PADDLES
    /*leftPaddle.position.y += leftPaddleMovement;
    rightPaddle.position.y += rightPaddleMovement;*/

    // LIMIT PADDLES
    /*if (leftPaddle.position.y > topWall.position.y) {
      leftPaddle.position.y = topWall.position.y;
    }
    if (leftPaddle.position.y < bottomWall.position.y) {
      leftPaddle.position.y = bottomWall.position.y;
    }
    if (rightPaddle.position.y > topWall.position.y) {
      rightPaddle.position.y = topWall.position.y;
    }
    if (rightPaddle.position.y < bottomWall.position.y) {
      rightPaddle.position.y = bottomWall.position.y;
    }*/

    // MOVE LIGHT
   /* for (let i = 0; i < this.balls.length; i++) {
      this.ballsLight[i].position.x = this.balls[i].mesh.position.x;
      this.ballsLight[i].position.y = this.balls[i].mesh.position.y;
    }*/

    //COLLISIONS
    for (let ballIndex = 0; ballIndex < this.balls.length; ballIndex++) {
      const ball = this.update.balls[ballIndex];
      for (let blockIndex = 0; blockIndex < this.blocks.length; blockIndex++) {
        const block = this.update.blocks[blockIndex];
        const intersection: [boolean, {pos : Vector2, normal : Vector2} | undefined] =
          this.circleRectangleIntersection(new THREE.Vector2(ball.pos.x, ball.pos.y),
            this.map.ballRadius,
            new THREE.Vector2(block.pos.x, block.pos.y),
            block.dimmensions);
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
              intersection : intersection[1],
              ball : ball
            },
          };
          this.manager.sendEvent(PongEventType.Colision, eventData);
          // ALL THIS LOGIC SHOULD BE ATTACHED TO EVENTS
          //this four ifs are to avoid the ball from getting stuck
          /*
          if (intersection[1][1].x < 0 && ball.dir.x < 0)
            continue;
          if (intersection[1][1].x > 0 && ball.dir.x > 0)
            continue;
          if (intersection[1][1].y < 0 && ball.dir.y < 0)
            continue;
          if (intersection[1][1].y > 0 && ball.dir.y > 0)
            continue;
          console.log('impact wall')
          console.log('inter', intersection[1][1])
          console.log('dir', ball.dir)
          if (intersection[1][1].x)
            ball.dir.x *= intersection[1][1].x;
          if (intersection[1][1].y)
            ball.dir.y *= -1;//intersection[1][1].y;
          console.log('dir after', ball.dir);
          console.log('endddd\n\n')
          */
        }
      }
      for (let paddlesIndex = 0; paddlesIndex < this.paddles.length; paddlesIndex++) {
        const paddle = this.update.paddles[paddlesIndex];
        const intersection: [boolean, {pos : Vector2, normal : Vector2} | undefined] =
          this.circleRectangleIntersection(new Vector2(ball.pos.x, ball.pos.y),
            this.map.ballRadius,
            new Vector2(paddle.pos.x, paddle.pos.y),
            paddle.dimmensions);          //todo!
        if (intersection[0]) {
          console.log('impact paddle')
          if (intersection[1] === undefined) {
            console.error('intersection but no data received');
            continue;
          }
          const eventData : EventData = {
            senderId : ball.getId(),
            targetIds : paddle.getId(),
            custom : {
              intersection : intersection[1],
              ball : ball
            }
          };
          this.manager.sendEvent(PongEventType.Colision, eventData);
          //this two ifs are to ensure the ball doesn't get stuck
          /*if (intersection[1][1].x < 0 && ball.dir.x < 0)
            continue;
          if (intersection[1][1].x > 0 && ball.dir.x > 0)
            continue;
          if (intersection[1][1].x) {
            //ball.dir.x *= -intersection[1][1].x;
            const angle = (intersection[1][0].y - paddle.pos.y) / this.map.paddleHeight * 2 * intersection[1][1].x;
            if (ball.dir.x > 0)
              ball.dir = new Vector2(-1, 0).rotateAround(new Vector2(0, 0), angle);
            else
              ball.dir = new Vector2(1, 0).rotateAround(new Vector2(0, 0), angle);
          }
          if (intersection[1][1].y)
            console.error('shouldn\'t happen');
          //ball.dir.y *= -intersection[1][1].y;
          */
        }
        // console.log('impacto paddle', paddle)
      }
    }

    // COLLISION BALL
    // COLLISION BOTTOM WALL
    /*
    for (let i = 0; i < this.balls.length; i++){
      const ball = this.balls[i];
      if (ball.position.y < -pseudoLimit) {
        if (collisionChangeBallColor) {
          const color = Math.random() * 0xFFFFFF;
          ball.material = new THREE.MeshPhongMaterial({ color: color });
          this.ballsLight[i].color = new THREE.Color(color);
        }
        if (collisionChangeWallColor) {
          bottomWall.material = new THREE.MeshPhongMaterial({ color: Math.random() * 0xFFFFFF });
        }
        ballAngle = -ballAngle;
        ball.position.y = -pseudoLimit;
        ballSpeed += aceleration * ballSpeed;
      }
      // COLLISION TOP WALL
      if (ball.position.y > pseudoLimit) {
        if (collisionChangeBallColor) {
          const color = Math.random() * 0xFFFFFF;
          ball.material = new THREE.MeshPhongMaterial({ color: color });
          light.color = new THREE.Color(color);
        }
        if (collisionChangeWallColor) {
          topWall.material = new THREE.MeshPhongMaterial({ color: Math.random() * 0xFFFFFF });
        }
        ballAngle = -ballAngle;
        ball.position.y = pseudoLimit;
        ballSpeed += aceleration * ballSpeed;
      }
      // COLLISION LEFT PADDLE
      if (ball.position.x < - pseudoLimit && ball.position.y + radius * 3 / 4 > leftPaddle.position.y - paddleWidth / 2 && ball.position.y - radius * 3 / 4 < leftPaddle.position.y + paddleWidth / 2) {
        if (collisionChangeBallColor) {
          const color = Math.random() * 0xFFFFFF;
          ball.material = new THREE.MeshPhongMaterial({ color: color });
          light.color = new THREE.Color(color);
        }
        if (collisionChangePaddleColor) {
          leftPaddle.material = new THREE.MeshPhongMaterial({ color: Math.random() * 0xFFFFFF });
        }

        const yDifference = (ball.position.y - leftPaddle.position.y) / paddleWidth / 2;
        ballAngle = deltaFactor * yDifference + Math.PI;
        if (leftPaddleMovement > 0)
          ballAngle += friction;
        if (leftPaddleMovement < 0)
          ballAngle -= friction;
        ball.position.x = -pseudoLimit;
        ballSpeed += aceleration * ballSpeed;
      }
      // COLLISION RIGHT PADDLE
      if (ball.position.x > pseudoLimit && ball.position.y + radius * 3 / 4 > rightPaddle.position.y - paddleWidth / 2 && ball.position.y - radius * 3 / 4 < rightPaddle.position.y + paddleWidth / 2) {
        if (collisionChangeBallColor) {
          const color = Math.random() * 0xFFFFFF;
          ball.material = new THREE.MeshPhongMaterial({ color: color });
          light.color = new THREE.Color(color);
        }
        if (collisionChangePaddleColor) {
          rightPaddle.material = new THREE.MeshPhongMaterial({ color: Math.random() * 0xFFFFFF });
        }

        const yDifference = (ball.position.y - rightPaddle.position.y) / paddleWidth / 2;
        ballAngle = - deltaFactor * yDifference;
        if (rightPaddleMovement > 0)
          ballAngle -= friction;
        if (rightPaddleMovement < 0)
          ballAngle += friction;
        ball.position.x = pseudoLimit;
        ballSpeed += aceleration * ballSpeed;
      }
  }*/

    // NORMALIZE ANGLE
    /*while (ballAngle < 0) {
      ballAngle += 2 * Math.PI;
    }
    while (ballAngle > 2 * Math.PI) {
      ballAngle -= 2 * Math.PI;
    }*/

    // SET PAST TIME
    this.pastTime = time;

    // CHECK WINNER
    /*if (ball.position.x < leftPaddle.position.x - paddleHeight) {
      alert('Right player wins!');
      window.location.reload();
    }
    if (ball.position.x > rightPaddle.position.x + paddleHeight) {
      alert('Left player wins!');
      window.location.reload();
    }*/
    /* !TODO
    abstracted away, should be handled by the manager
    if (this..settings.host && this.lastUpdate > 0.05) { 
      this.lastUpdate = 0;
      //console.log('updating')
      this.sendUpdate();
    }
    */
    this.updateScene();
    this.renderer.render(this.scene, this.camera);
    //requestAnimationFrame(render);
    //requestAnimationFrame(render); 
  }

  /* !THIS IS MANAGED BY THE SERVER BY ITSELF
  updateGame() {
    if (this.matchmakingService.currentMatch === undefined) {
      console.error('update game: no current match in matchmaking');
      return;
    }
    if (this.matchmakingService.currentMatch.update.id === 0)
      return;
    for (let i = 0; i < this.matchmakingService.currentMatch.update.ballsPosition.length; i++) {
      this.balls[i].pos.x = this.matchmakingService.currentMatch.update.ballsPosition[i].x;
      this.balls[i].mesh.position.y = this.matchmakingService.currentMatch.update.ballsPosition[i].y;
    }
    for (let i = 0; i < this.matchmakingService.currentMatch.update.paddlesPosition.length; i++) {
      this.paddles[i].mesh.position.y = this.matchmakingService.currentMatch.update.paddlesPosition[i];
    }
    this.currentMatchStateId = this.matchmakingService.currentMatch.update.id;
  }
  */
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
      this.paddles[index].material = new THREE.MeshPhongMaterial({ color: paddle.color });
    }
    for (const [index, block] of this.update.blocks.entries()){
      this.blocks[index].position.set(block.pos.x, block.pos.y, 0);
      this.blocks[index].material = new THREE.MeshPhongMaterial({ color: block.color });
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
