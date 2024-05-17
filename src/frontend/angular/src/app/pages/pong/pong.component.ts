import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as THREE from 'three';
import * as key from 'keymaster'; // Si estás utilizando TypeScript

import { GameSettings, MatchmakingService} from '../../services/matchmaking.service';
import { GameConfigService } from '../../services/game-config.service';
import { normalize } from 'three/src/math/MathUtils';
import { left } from '@popperjs/core';

export const colorPalette = {
  darkestPurple: 0x1C0658,
  swingPurple: 0x5C2686,
  roseGarden: 0xFF1690,
  josefYellow: 0xF4D676,
  leadCyan: 0x36CDC4,
  white: 0xFFFFFF,
  black: 0x000000,
};



class Ball {
  mesh : THREE.Mesh;
  light : THREE.PointLight;

  radius : number;
  speed : number;
  aceleration : number;//after a collision
  angle : number;
  colorChange : boolean;

  constructor(private configService: GameConfigService) {
    this.radius = this.configService.radius;
    const widthSegments = this.configService.widthSegments;
    const heightSegments = this.configService.heightSegments;
    const ballGeometry = new THREE.SphereGeometry(this.radius, widthSegments, heightSegments);
    const ballColor = this.configService.ballColor;
    const ballMaterial = new THREE.MeshPhongMaterial({color: ballColor});
    this.mesh = new THREE.Mesh(ballGeometry, ballMaterial);
    this.speed = this.configService.ballSpeed;
    this.aceleration = this.configService.aceleration;
    this.angle = this.configService.ballAngle;
    const color = ballColor;
    const intensity = this.configService.ballLightIntensity;
    this.light = new THREE.PointLight( color, intensity );
    this.colorChange = this.configService.collisionChangeBallColor;
  }

  addToScene(scene: THREE.Scene) {
    scene.add(this.mesh);
    scene.add(this.light);
  }

  update(timeDelta : number) {
    const ballDiferentialDisplacement = timeDelta * this.speed;
    this.mesh.position.x -= ballDiferentialDisplacement * Math.cos(this.angle);
    this.mesh.position.y -= ballDiferentialDisplacement * Math.sin(this.angle);
    this.light.position.x = this.mesh.position.x;
    this.light.position.y = this.mesh.position.y;
  }

  changeColor(color: number) {
    this.mesh.material = new THREE.MeshPhongMaterial({color: color});
    this.light.color = new THREE.Color(color);
  }

  yCollision(y: number) {// y is the ideal position of the ball when it collides
    this.angle = -this.getAngle();
    this.getPosition().y = y;
    this.speed += this.getAceleration() * this.getSpeed();
    if (this.colorChange)
      this.changeColor(Math.random() * 0xFFFFFF);
  }

  xCollision(x: number) {// x is the ideal position of the ball when it collides
    this.angle = Math.PI - this.getAngle();
    this.getPosition().x = x;
    this.speed += this.getAceleration() * this.getSpeed();
    if (this.colorChange)
      this.changeColor(Math.random() * 0xFFFFFF);
  }

  //GETTERS
  getPosition() {
    return this.mesh.position;
  }

  getAngle() {
    return this.angle;
  }

  getSpeed() {
    return this.speed;
  }

  getAceleration() {
    return this.aceleration;
  }

  getRadius() {
    return this.radius;
  }

  //SETTERS
  setAngle(angle: number) {
    this.angle = angle;
    //normalize angle
    while (this.angle < 0) {
      this.angle += 2 * Math.PI;
    }
    while (this.angle > 2 * Math.PI) {
      this.angle -= 2 * Math.PI;
    }
  }
}

class Paddle {
  mesh : THREE.Mesh;
  speed : number;
  friction : number;
  deltaFactor : number;
  height : number;
  width : number;
  upKey : string;
  downKey : string;
  goinUp : boolean = false;
  goinDown : boolean = false;
  localPlayer : boolean = false;
  AIplayer : boolean = false;
  AIprediction : number = 0;

  constructor(private configService: GameConfigService) {
    this.width = this.configService.paddleWidth;
    this.height = this.configService.paddleHeight;
    const paddleDepth = this.configService.paddleDepth;
    const paddleGeometry = new THREE.BoxGeometry(this.width, this.height, paddleDepth);
    const paddleColor = this.configService.paddleColor;
    const paddleMaterial = new THREE.MeshPhongMaterial({color: paddleColor});
    this.mesh = new THREE.Mesh(paddleGeometry, paddleMaterial);
    this.speed = this.configService.paddleSpeed;
    this.upKey = this.configService.defaultUpKey;
    this.downKey = this.configService.defaultDownKey;
    this.friction = this.configService.friction;
    this.deltaFactor = this.configService.deltaFactor;
  }

  addToScene(scene: THREE.Scene) {
    scene.add(this.mesh);
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
    if (this.getPosition().y < this.AIprediction - this.getWidth() / 42) {
      this.goinUp = true;
      this.goinDown = false;
    }
    else if (this.getPosition().y > this.AIprediction + this.getWidth() / 42) {
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
      this.getPosition().y += paddleDiferentialDisplacement;
    }
    if (this.goinDown) {
      this.getPosition().y -= paddleDiferentialDisplacement;
    }
  }

  changeColor(color: number) {
    this.mesh.material = new THREE.MeshPhongMaterial({color: color});
  }

  limitYmax(maxY: number) {
    if (this.getPosition().y > maxY) {
      this.getPosition().y = maxY;
    }
  }

  limitYmin(minY: number) {
    if (this.getPosition().y < minY) {
      this.getPosition().y = minY;
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

  //GETTERS
  getPosition() {
    return this.mesh.position;
  }
  getRotation() {
    return this.mesh.rotation;
  }
  getWidth() {
    return this.width;
  }
  getHeight() {
    return this.height;
  }
  isAI() {
    return this.AIplayer;
  }

  //SETTERS
  setAIprediction(prediction: number) {
    this.AIprediction = prediction;
  }
  
}

class LeftPaddle extends Paddle {
  constructor(private _configService: GameConfigService) {// lo de _configService es para que no se confunda con el configService de la clase Paddle(apaño)
    super(_configService);
    this.getPosition().x = this._configService.leftPaddleX;
    this.getPosition().y = this._configService.leftPaddleY;
    this.getRotation().z = this._configService.leftPaddleRotation;
    this.upKey = this._configService.leftUpKey;
    this.downKey = this._configService.leftDownKey;
    this.madeLocalPlayer();
  }

  handleCollision(ball: Ball) {
    const pseudoLimitx = this.getPosition().x + ball.getRadius() + this.height / 2;
    const pseudoLimitymax = this.getPosition().y + ball.getRadius() + this.width / 2;
    const pseudoLimitymin = this.getPosition().y - ball.getRadius() - this.width / 2;
    if (ball.getPosition().x < pseudoLimitx && ball.getPosition().y < pseudoLimitymax && ball.getPosition().y > pseudoLimitymin) {
      ball.xCollision(pseudoLimitx);
      const yDifference = (ball.getPosition().y - this.getPosition().y) / this.getWidth() / 2;
      ball.setAngle(this.deltaFactor * yDifference + Math.PI);
      ball.setAngle
      if (this.goinUp)
        ball.setAngle(ball.getAngle() + this.friction);
      if (this.goinDown)
        ball.setAngle(ball.getAngle() - this.friction);
      if (this._configService.collisionChangeWallColor) {
        this.changeColor(Math.random() * 0xFFFFFF);
      }
    }
  }
}

class RightPaddle extends Paddle {
  constructor(private _configService: GameConfigService) {
    super(_configService);
    this.getPosition().x = this._configService.rightPaddleX;
    this.getPosition().y = this._configService.rightPaddleY;
    this.getRotation().z = this._configService.rightPaddleRotation;
    this.upKey = this._configService.rightUpKey;
    this.downKey = this._configService.rightDownKey;
    if (this._configService.IAisOn) {
      this.madeAIPlayer();
    }
    else {
      this.madeLocalPlayer();
    }
  }
  handleCollision(ball: Ball) {
    const pseudoLimitx = this.getPosition().x - ball.getRadius() - this.height / 2;
    const pseudoLimitymax = this.getPosition().y + ball.getRadius() + this.width / 2;
    const pseudoLimitymin = this.getPosition().y - ball.getRadius() - this.width / 2;
    if (ball.getPosition().x > pseudoLimitx && ball.getPosition().y < pseudoLimitymax && ball.getPosition().y > pseudoLimitymin) {
      ball.xCollision(pseudoLimitx);
      const yDifference = (ball.getPosition().y - this.getPosition().y) / this.getWidth() / 2;
      ball.setAngle(- this.deltaFactor * yDifference);
      if (this.goinUp)
        ball.setAngle(ball.getAngle() - this.friction);
      if (this.goinDown)
        ball.setAngle(ball.getAngle() + this.friction);
      if (this._configService.collisionChangeWallColor) {
        this.changeColor(Math.random() * 0xFFFFFF);
      }
    }
  }
}

class Wall {
  mesh : THREE.Mesh;
  width : number;
  height : number;

  constructor(private configService: GameConfigService) {
    this.width = this.configService.wallWidth;
    this.height = this.configService.wallHeight;
    const wallDepth = this.configService.wallDepth;
    const wallGeometry = new THREE.BoxGeometry(this.width, this.height, wallDepth);
    const wallColor = this.configService.wallColor;
    const wallMaterial = new THREE.MeshPhongMaterial({color: wallColor});
    this.mesh = new THREE.Mesh(wallGeometry, wallMaterial);
  }

  addToScene(scene: THREE.Scene) {
    scene.add(this.mesh);
  }

  changeColor(color: number) {
    this.mesh.material = new THREE.MeshPhongMaterial({color: color});
  }

  //GETTERS
  getPosition() {
    return this.mesh.position;
  }


}

class TopWall extends Wall {
  constructor(private _configService: GameConfigService) {
    super(_configService);
    this.mesh.position.x = this._configService.topWallX;
    this.mesh.position.y = this._configService.topWallY;
    this.mesh.position.z = this._configService.topWallZ;
  }

  handleCollision(ball: Ball) {
    const pseudoLimit =  this.getPosition().y - ball.getRadius() - this.height / 2;
    if (ball.getPosition().y > pseudoLimit) {
      ball.yCollision(pseudoLimit);
      if (this._configService.collisionChangeWallColor) {
        this.changeColor(Math.random() * 0xFFFFFF);
      }
    }
  }
}

class BottomWall extends Wall {
  constructor(private _configService: GameConfigService) {
    super(_configService);
    this.mesh.position.x = this._configService.bottomWallX;
    this.mesh.position.y = this._configService.bottomWallY;
    this.mesh.position.z = this._configService.bottomWallZ;
  }

  handleCollision(ball: Ball) {
    const pseudoLimit =  this.getPosition().y + ball.getRadius() + this.height / 2;
    if (ball.getPosition().y < pseudoLimit) {
      ball.yCollision(pseudoLimit);
      if (this._configService.collisionChangeWallColor) {
        this.changeColor(Math.random() * 0xFFFFFF);
      }
    }
  }
}

class Camera {
  camera : THREE.PerspectiveCamera;

  constructor(private configService: GameConfigService) {
    const fov = this.configService.fov;
    const aspect = this.configService.aspect;
    const near = this.configService.near;
    const far = this.configService.far;
    this.camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
    this.camera.position.z = this.configService.cameraZ;
  }
}

class GeneralLights {
  mainLight : THREE.DirectionalLight | undefined;

  constructor(private configService: GameConfigService) {
    const defaultLightingIsOn = this.configService.defaultLightingIsOn;

    if (defaultLightingIsOn)
    {
      const color = this.configService.defaultlightColor;
      const intensity = this.configService.defaultLightIntensity;
      this.mainLight = new THREE.DirectionalLight( color, intensity );
      const X = this.configService.defaultLightPositionX;
      const Y = this.configService.defaultLightPositionY;
      const Z = this.configService.defaultLightPositionZ;
      this.mainLight.position.set( X, Y, Z);
    }
  }

  addToScene(scene: THREE.Scene) {
    if (this.mainLight)
      scene.add(this.mainLight);
  }
}

@Component({
  selector: 'app-pong',
  templateUrl: './pong.component.html',
  styleUrls: ['./pong.component.css']
})
export class PongComponent implements AfterViewInit {

  @ViewChild('pongCanvas', { static: true }) pongCanvas!: ElementRef<HTMLCanvasElement>;
  
  constructor(private matchmakingService: MatchmakingService, private configService: GameConfigService) {
  }

  ngAfterViewInit(): void {
    this.main();
  }

  main() {
    //INITIALIZE THREE.JS
    // INIT SCENE
    const canvas = this.pongCanvas.nativeElement;
    const renderer = new THREE.WebGLRenderer( { antialias: true, canvas } );
  
    // INIT CAMERA
    const camera = new Camera(this.configService);

    // INIT SCENE
    const scene = new THREE.Scene();

    const defaultLightingIsOn = this.configService.defaultLightingIsOn;
    // INIT LIGHTS
    const generalLights = new GeneralLights(this.configService);
    generalLights.addToScene(scene);

    // // INIT BALL
    const ball = new Ball(this.configService);
    ball.addToScene(scene);

    // INIT PADDLES
    const leftPaddle = new LeftPaddle(this.configService);
    const rightPaddle = new RightPaddle(this.configService);
    leftPaddle.addToScene(scene);
    rightPaddle.addToScene(scene);

    // INIT WALLS
    const topWall = new TopWall(this.configService);
    const bottomWall = new BottomWall(this.configService);
    topWall.addToScene(scene);
    bottomWall.addToScene(scene);

    // Init loop variables
    let pastTime = 0;
    let pastIATime = 0;

    function render(time: number) {

      time *= 0.001; // convert time to seconds

      // DISPLAY TIME
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
  
      const timeElement = document.getElementById('time');
      if (timeElement) {
          timeElement.innerText = `${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s `;
      }

      const timeDifference = time - pastTime;

      // MOVE BALL
      ball.update(timeDifference);

      // HANDLE PADDLE MOVEMENT
      if (rightPaddle.isAI()) {
        if (time - pastIATime > 1) { // IA only sees the ball every second
          console.log('IA');
          pastIATime = time;
          let predictedBallY = 0;

          // IA PREDICTION
          predictedBallY = ball.getPosition().y +(Math.tan(ball.getAngle() - Math.PI) * (rightPaddle.getPosition().x - ball.getPosition().x)); //trigonometria
          const pseudoLimitMax = topWall.getPosition().y - topWall.height / 2 - ball.getRadius();
          const pseudoLimitMin = bottomWall.getPosition().y + bottomWall.height / 2 + ball.getRadius();
          while (predictedBallY > pseudoLimitMax || predictedBallY < pseudoLimitMin) {
            if (predictedBallY > pseudoLimitMax) {
              predictedBallY = pseudoLimitMax - (predictedBallY - pseudoLimitMax);
            }
            if (predictedBallY < pseudoLimitMin) {
              predictedBallY = pseudoLimitMin - (predictedBallY - pseudoLimitMin);
            }
          }
          predictedBallY  += (Math.random() - Math.random()) * (rightPaddle.getWidth() - ball.getRadius())/2 ;
          if (ball.getAngle() < Math.PI / 2 || ball.getAngle() > 3 * Math.PI / 2) {
            predictedBallY = (predictedBallY + leftPaddle.getPosition().y) / 2;
          }
          rightPaddle.setAIprediction(predictedBallY);
        }
      }
      // UPDATE PADDLES
      leftPaddle.update(timeDifference);
      rightPaddle.update(timeDifference);


      // // LIMIT PADDLES
      leftPaddle.limitYmax(topWall.getPosition().y - topWall.height / 2);
      leftPaddle.limitYmin(bottomWall.getPosition().y + bottomWall.height / 2);
      rightPaddle.limitYmax(topWall.getPosition().y - topWall.height / 2);
      rightPaddle.limitYmin(bottomWall.getPosition().y + bottomWall.height / 2);

      // HANDLE COLLISIONS
      topWall.handleCollision(ball);
      bottomWall.handleCollision(ball);
      leftPaddle.handleCollision(ball);
      rightPaddle.handleCollision(ball);

      // SET PAST TIME
      pastTime = time;

      // CHECK WINNER
      if (ball.getPosition().x < leftPaddle.getPosition().x - leftPaddle.getHeight()) {
        alert('Right player wins!');
        window.location.reload();
      }
      if (ball.getPosition().x > rightPaddle.getPosition().x + rightPaddle.getHeight()) {
        alert('Left player wins!');
        window.location.reload();
      }

      renderer.render(scene, camera.camera);
      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
  
  }
}
