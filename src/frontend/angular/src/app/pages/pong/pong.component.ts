import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy} from '@angular/core';
import * as THREE from 'three';
import * as key from 'keymaster'; // Si estás utilizando TypeScript
import { Vector2 } from 'three';
import { Subscription } from 'rxjs';

import { Input } from '@angular/core';

import { GameSettings, MatchGame, MatchUpdate, MatchmakingService} from '../../services/matchmaking.service';
import { GameConfigService, GameConfigState } from '../../services/game-config.service';
import { Rect } from '@popperjs/core';
import { normalize } from 'three/src/math/MathUtils';
import { Router } from '@angular/router';



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
  const color = this.configService.defaultlightColor;
  const intensity = this.configService.defaultLightIntensity;
  const light = new THREE.DirectionalLight(color, intensity);
  const X = this.configService.defaultLightPositionX;
  const Y = this.configService.defaultLightPositionY;
  const Z = this.configService.defaultLightPositionZ;
  light.position.set(X, Y, Z);

  constructor(color, intensity, ){

  }
}*/

class RenderRectangle{
  dimmensions : THREE.Vector2;

  mesh : THREE.Mesh;
  constructor(dimmensions : THREE.Vector2, mesh : THREE.Mesh){
    this.dimmensions = dimmensions;
    this.mesh = mesh;
  } 
}

class Ball {
  mesh : THREE.Mesh;
  dir : THREE.Vector2;
  speed : number;
  constructor(mesh : THREE.Mesh, dir : THREE.Vector2, speed : number){
    this.mesh = mesh;
    this.dir = dir;
    this.speed = speed;
  }
}

@Component({
  selector: 'app-pong',
  templateUrl: './pong.component.html',
  styleUrls: ['./pong.component.css']
})
export class PongComponent implements AfterViewInit, OnDestroy{

  @ViewChild('pongCanvas', { static: true }) pongCanvas!: ElementRef<HTMLCanvasElement>;
  // @Input gameSettings!: GameSettings;//affectan el juego a todos los jugadores
  // @Input clientSettings!; 
    // affectan el juego solo al cliente
    // colores
    // imagen de fondo   

  running : boolean = false;
  renderer! : THREE.WebGLRenderer;
  canvas : any;
  camera! : THREE.PerspectiveCamera;
  scene! : THREE.Scene;
  light! : THREE.Light; 
  balls : Ball[] = [];
  ballsLight : THREE.Light[] = [];
  walls : RenderRectangle[] = [];//0 is top 1 is bottom
  paddles : RenderRectangle[] = [];
  pastTime : number = 0;
  lastUpdate : number = 0;
  currentMatchStateId = 0;
  
  currentGame! : MatchGame;//it should always exist when a game starts, even if not at construction

  configStateSubscription! : Subscription;

  constructor(private matchmakingService: MatchmakingService, private configService: GameConfigService,
              private router : Router) {
  }

  ngOnDestroy(): void {
    if (this.renderer){
      this.renderer.setAnimationLoop(null);
      this.running = false;
    }
  }

  manageState(state : GameConfigState) : boolean{
      switch (state){
        case GameConfigState.Standby:
          console.error('no current game should not render'); 
          if (this.configStateSubscription)
            this.configStateSubscription.unsubscribe();
          return true;
        case GameConfigState.Ingame:
          if (this.configService.gameSettings === undefined) {
            console.error('game Settings must be initialized');
            return true;
          }
          if (this.matchmakingService.currentMatch === undefined && this.configService.online) {
            console.error('matchmaking current match must be initialized if online is true');
            return true;
          }
          if (this.running)
            return true;
          this.initValues();
          this.running = true;
          this.renderer.setAnimationLoop(this.render.bind(this));
          return false;
      }
      return false;
  }

  ngAfterViewInit(): void { 
    if (this.manageState(this.configService.state.getCurrentValue()))
      return;
    this.configStateSubscription = this.configService.state.observable.subscribe(state => {
      this.manageState(state);
    });
  }
  initValues(){
    if (this.configService.gameSettings === undefined){
      console.error('game Settings must be initialized');
      return;
    }
    const initialState = this.matchmakingService.getMatchGame();
    if (initialState){
      this.currentGame = initialState;
    }
    //INITIALIZE THREE.JS
    // INIT SCENE
    this.canvas = this.pongCanvas.nativeElement;
    this.renderer = new THREE.WebGLRenderer( { antialias: true, canvas : this.canvas } );
  
    // INIT CAMERA
    /*const fov = this.configService.fov;
    const aspect = this.configService.aspect;
    const near = this.configService.near;
    const far = this.configService.far;*/
    this.camera = new THREE.PerspectiveCamera( this.configService.fov,
                                                this.configService.aspect,
                                                this.configService.near,
                                                this.configService.far );
    this.camera.position.z = this.configService.cameraZ;

    // INIT SCENE
    this.scene = new THREE.Scene();

    //const defaultLightingIsOn = this.configService.defaultLightingIsOn;
    // INIT LIGHT
    if (this.configService.defaultLightingIsOn)
    {
      //const color = this.configService.defaultlightColor;
      //const intensity = this.configService.defaultLightIntensity;
      this.light = new THREE.DirectionalLight( this.configService.defaultlightColor,
                                                this.configService.defaultLightIntensity);
      //const X = this.configService.defaultLightPositionX;
      //const Y = this.configService.defaultLightPositionY;
      //const Z = this.configService.defaultLightPositionZ;
      this.light.position.set(this.configService.defaultLightPositionX,
                         this.configService.defaultLightPositionY,
                         this.configService.defaultLightPositionZ);
      this.scene.add(this.light);
    }

    // INIT BALL
    /*const radius = this.configService.radius;
    const widthSegments = this.configService.widthSegments;
    const heightSegments = this.configService.heightSegments;*/
    const ballGeometry = new THREE.SphereGeometry(this.configService.radius,
                                                  this.configService.widthSegments,
                                                  this.configService.heightSegments);
//    const ballColor = this.configService.ballColor;
    const ballMaterial = new THREE.MeshPhongMaterial({color: this.configService.ballColor});
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    this.balls.push(new Ball(ball, this.configService.ballDir, this.configService.ballSpeed));
    this.scene.add(ball);
    
    // INIT BALL LIGHT
    /*const color = this.configService.ballLightColor;
    const intensity = this.configService.ballLightIntensity;*/
    const ballLight = new THREE.PointLight( this.configService.ballLightColor,
                                        this.configService.ballLightIntensity);
    this.ballsLight.push(ballLight);
    this.scene.add( ballLight );

    // INIT PADDLES
    //const paddleWidth = this.configService.paddleWidth;
    //const paddleHeight = this.configService.paddleHeight;
    //const paddleDepth = this.configService.paddleDepth;
    const paddleGeometry = new THREE.BoxGeometry(this.configService.paddleWidth,
                                                 this.configService.paddleHeight,
                                                 this.configService.paddleDepth);
    //const paddleColor = this.configService.paddleColor;
    const paddleMaterial = new THREE.MeshPhongMaterial({color: this.configService.paddleColor});
   
    for (let i = 0; i < this.configService.gameSettings.teamSize * 2; i++){
      const paddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
      const dimmensions = new THREE.Vector2(this.configService.paddleWidth, this.configService.paddleHeight);
      if (i < this.configService.gameSettings.teamSize){
        paddle.position.x = this.configService.leftPaddle.x;
        paddle.position.y = this.configService.leftPaddle.y;
        paddle.rotation.z = this.configService.leftPaddle.z;
      }else{
        paddle.position.x = this.configService.rightPaddle.x;
        paddle.position.y = this.configService.rightPaddle.y;
        paddle.rotation.z = this.configService.rightPaddle.z;
      }
      this.paddles.push(new RenderRectangle(dimmensions, paddle));
      this.scene.add(paddle);
    }
    /*const leftPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
    leftPaddle.position.x = this.configService.leftPaddleX;
    leftPaddle.position.y = this.configService.leftPaddleY;
    leftPaddle.rotation.z = this.configService.leftPaddleRotation;
    
    const rightPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
   this.scene.add(leftPaddle);
    this.scene.add(rightPaddle);
    const paddleSpeed = this.configService.paddleSpeed;*/

    // INIT WALLS
    /*const wallWidth = this.configService.wallWidth;
    const wallHeight = this.configService.wallHeight;
    const wallDepth = this.configService.wallDepth;*/
    const wallGeometry = new THREE.BoxGeometry(this.configService.wallWidth,
                                               this.configService.wallHeight,
                                               this.configService.wallDepth);
    //const wallColor = this.configService.wallColor;
    const wallMaterial = new THREE.MeshPhongMaterial({color: this.configService.wallColor});

    const wallDimmensions = new THREE.Vector2(this.configService.wallWidth, this.configService.wallHeight) 
    
    const topWall = new THREE.Mesh(wallGeometry, wallMaterial);
    topWall.position.x = this.configService.topWall.x;
    topWall.position.y = this.configService.topWall.y;
    topWall.position.z = this.configService.topWall.z;
    
    const bottomWall = new THREE.Mesh(wallGeometry, wallMaterial);
    bottomWall.position.x = this.configService.bottomWall.x;
    bottomWall.position.y = this.configService.bottomWall.y;
    bottomWall.position.z = this.configService.bottomWall.z;
    
    this.scene.add(topWall);
    this.scene.add(bottomWall);
    this.walls.push(new RenderRectangle(wallDimmensions, topWall));
    this.walls.push(new RenderRectangle(wallDimmensions, bottomWall));
  }

  render(time : number) {
    if (this.configService.gameSettings === undefined){
      console.error('game Settings must be initialized');
      return; 
    }
    if (this.matchmakingService.currentMatch === undefined && this.configService.online){
      console.error('matchmaking current match must be initialized if online is true');
      return; 
    }
    const IA = this.configService.IAisOn;
    time *= 0.001; // convert time to seconds

    let pastIATime = 0;
    let predictedBallY = 0;
    if (this.configService.gameSettings === undefined) {
      console.error('match state and game settings must be initialized for rendering');
      return;
    }

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
    //if (!this.configService.host)
      //console.log('id', this.currentGame.update.id, '\nid2', this.matchmakingService.currentMatch?.update.id);
    if (this.configService.online
      && !this.configService.host && this.matchmakingService.currentMatch!.update.id != this.currentMatchStateId) {
      //this.balls[0].mesh.position.x = this.configService.matchState.update.ballsPosition[0];
      this.updateGame();
  //    console.log('update?');
    }else{
      const ballDiferentialDisplacement = timeDifference * this.balls[0].speed; 
      let pos = new THREE.Vector2(this.balls[0].mesh.position.x, this.balls[0].mesh.position.y);
      pos.add(this.balls[0].dir.clone().multiplyScalar(ballDiferentialDisplacement));
//      console.log('new pos', pos);
      this.balls[0].mesh.position.x = pos.x;
      this.balls[0].mesh.position.y = pos.y;
    }
      //console.log('ball new position: ', this.balls[0].mesh.position.x, this.balls[0].mesh.position.y);
    //}

    // HANDLE PADDLE MOVEMENT
    const pseudoLimit = 1 - this.configService.radius;
    const paddleDiferentialDisplacement = timeDifference * this.configService.paddleSpeed;

    // PADDLES MOVEMENT
    for (let i = 0; i < this.configService.gameSettings.teamSize; i++) {
      const paddle = this.paddles[i];
      if (key.isPressed(this.configService.keys[i].up)) {
        // console.log('key pressed', i, paddle.mesh.position.y);
        paddle.mesh.position.y -= paddleDiferentialDisplacement;
        // console.log('key pressed', i, this.paddles[i].mesh.position.y);
        //if (paddle.mesh.position.y > this.walls[0].mesh.position.y)
        // paddle.mesh.position.y = this.walls[0].mesh.position.y - paddle.mesh.position.y;
      }
      if (key.isPressed(this.configService.keys[i].down)) {
        //   console.log('key pressed');
        paddle.mesh.position.y += paddleDiferentialDisplacement;
        // if (paddle.mesh.position.y < this.walls[1].mesh.position.y)
        //  paddle.mesh.position.y = this.walls[1].mesh.position.y - paddle.mesh.position.y;
      }
    }
    if (!this.configService.online) {
      for (let i = this.configService.gameSettings.teamSize; i < this.configService.gameSettings.teamSize * 2; i++) {
        const paddle = this.paddles[i];
        if (key.isPressed(this.configService.keys[i].up)) {
          paddle.mesh.position.y += paddleDiferentialDisplacement;
        }
        if (key.isPressed(this.configService.keys[i].down)) {
          paddle.mesh.position.y -= paddleDiferentialDisplacement;
        }
      }
    }
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
    for (let i = 0; i < this.balls.length; i++) {
      this.ballsLight[i].position.x = this.balls[i].mesh.position.x;
      this.ballsLight[i].position.y = this.balls[i].mesh.position.y;
    }

    //COLLISIONS
    for (let ballIndex = 0; ballIndex < this.balls.length; ballIndex++) {
      const ball = this.balls[ballIndex];
      for (let wallIndex = 0; wallIndex < this.walls.length; wallIndex++) {
        const wall = this.walls[wallIndex];
        const intersection: [boolean, [Vector2, Vector2] | undefined] =
          this.circleRectangleIntersection(new THREE.Vector2(ball.mesh.position.x, ball.mesh.position.y),
            this.configService.radius,
            new THREE.Vector2(wall.mesh.position.x, wall.mesh.position.y),
            wall.dimmensions);
        //todo!
        if (intersection[0]) {
          if (intersection[1] === undefined) {
            console.error('intersection but no data received');
            continue;
          }
          //this four ifs are to avoid the ball from getting stuck
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
        }
      }
      for (let paddlesIndex = 0; paddlesIndex < this.paddles.length; paddlesIndex++) {
        const paddle = this.paddles[paddlesIndex];
        const intersection: [boolean, [Vector2, Vector2] | undefined] =
          this.circleRectangleIntersection(new Vector2(ball.mesh.position.x, ball.mesh.position.y),
            this.configService.radius,
            new Vector2(paddle.mesh.position.x, paddle.mesh.position.y),
            paddle.dimmensions);          //todo!
        if (intersection[0]) {
          console.log('impact paddle')
          if (intersection[1] === undefined) {
            console.error('intersection but no data received');
            continue;
          }
          //this two ifs are to ensure the ball doesn't get stuck
          if (intersection[1][1].x < 0 && ball.dir.x < 0)
            continue;
          if (intersection[1][1].x > 0 && ball.dir.x > 0)
            continue;
          if (intersection[1][1].x) {
            //ball.dir.x *= -intersection[1][1].x;
            const angle = (intersection[1][0].y - paddle.mesh.position.y) / this.configService.paddleHeight * 2 * intersection[1][1].x;
            if (ball.dir.x > 0)
              ball.dir = new Vector2(-1, 0).rotateAround(new Vector2(0, 0), angle);
            else
              ball.dir = new Vector2(1, 0).rotateAround(new Vector2(0, 0), angle);
          }
          if (intersection[1][1].y)
            console.error('shouldn\'t happen');
          //ball.dir.y *= -intersection[1][1].y;

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
    if (this.configService.host && this.lastUpdate > 0.05) { 
      this.lastUpdate = 0;
      //console.log('updating')
      this.sendUpdate();
    }
    this.renderer.render(this.scene, this.camera);
    //requestAnimationFrame(render);
    //requestAnimationFrame(render); 
  }

  updateGame(){
    if (this.matchmakingService.currentMatch === undefined){
      console.error('update game: no current match in matchmaking');
      return;
    }
    if (this.matchmakingService.currentMatch.update.id === 0)
      return;
    for (let i = 0; i < this.matchmakingService.currentMatch.update.ballsPosition.length; i++){
      this.balls[i].mesh.position.x = this.matchmakingService.currentMatch.update.ballsPosition[i].x;
      this.balls[i].mesh.position.y = this.matchmakingService.currentMatch.update.ballsPosition[i].y;
    }
    for (let i = 0; i < this.matchmakingService.currentMatch.update.paddlesPosition.length; i++){
      this.paddles[i].mesh.position.y = this.matchmakingService.currentMatch.update.paddlesPosition[i];
    }
    this.currentMatchStateId = this.matchmakingService.currentMatch.update.id;
  }

  circleRectangleIntersection(circlePos : THREE.Vector2, circleRadious : number,
                              rectPos : THREE.Vector2, rectDimmensions : THREE.Vector2) : [boolean, [THREE.Vector2, THREE.Vector2] | undefined]{

    const pos : THREE.Vector2 = new THREE.Vector2(circlePos.x, circlePos.y);
    const normal : Vector2 =  new Vector2(0,0);
    if (circlePos.x < rectPos.x - rectDimmensions.x / 2){
      pos.x = rectPos.x - rectDimmensions.x / 2;
      normal.x = -1;
    }
    else{
      if (circlePos.x > rectPos.x + rectDimmensions.x / 2){
        pos.x = rectPos.x + rectDimmensions.width / 2;
        normal.x = 1;
      }
    }
    if (circlePos.y < rectPos.y - rectDimmensions.y / 2){
      pos.y = rectPos.y - rectDimmensions.y / 2;
      normal.y = -1;
    }
    else{
      if (circlePos.y > rectPos.y + rectDimmensions.y / 2){
        pos.y = rectPos.y + rectDimmensions.y / 2;
        normal.y = 1;
      }
    }
    const distance = pos.distanceTo(circlePos);
    if (distance <= circleRadious)
      return [true, [pos, normal]];
    return [false, undefined];
  }

  sendUpdate(){
    const paddlesPosition = this.paddles.map(paddle => paddle.mesh.position.y);
    const ballsPosition = this.balls.map(ball => new Vector2(ball.mesh.position.x, ball.mesh.position.y));
    const ballsDir = this.balls.map(ball => ball.dir);
    const ballsSpeed = this.balls.map(ball => ball.speed);
    const update = new MatchUpdate(paddlesPosition, undefined,ballsPosition, ballsDir, ballsSpeed, this.currentMatchStateId, this.matchmakingService.currentMatchInfo!);
    this.matchmakingService.sendMatchUpdate(update);
    this.currentMatchStateId += 1;
  }
}
