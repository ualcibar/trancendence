import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as THREE from 'three';
import * as key from 'keymaster'; // Si estás utilizando TypeScript

import { GameSettings, MatchmakingService} from '../../services/matchmaking.service';
import { GameConfigService } from '../../services/game-config.service';
import { normalize } from 'three/src/math/MathUtils';

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
  }

  adToScene(scene: THREE.Scene) {
    scene.add(this.mesh);
    scene.add(this.light);
  }

  update(timeDelta : number) {
    const ballDiferentialDisplacement = timeDelta * this.speed;
    this.mesh.position.x += ballDiferentialDisplacement * Math.cos(this.angle);
    this.mesh.position.y += ballDiferentialDisplacement * Math.sin(this.angle);
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
  }

  xCollision(x: number) {// x is the ideal position of the ball when it collides
    this.angle = Math.PI - this.getAngle();
    this.getPosition().x = x;
    this.speed += this.getAceleration() * this.getSpeed();
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

@Component({
  selector: 'app-pong',
  templateUrl: './pong.component.html',
  styleUrls: ['./pong.component.css']
})
export class PongComponent implements AfterViewInit {

  @ViewChild('pongCanvas', { static: true }) pongCanvas!: ElementRef<HTMLCanvasElement>;
  // @Input gameSettings!: GameSettings;//affectan el juego a todos los jugadores
  // @Input clientSettings!; 
    // affectan el juego solo al cliente
    // colores
    // imagen de fondo
  
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
    const fov = this.configService.fov;
    const aspect = this.configService.aspect;
    const near = this.configService.near;
    const far = this.configService.far;
    const camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
    camera.position.z = this.configService.cameraZ;

    // INIT SCENE
    const scene = new THREE.Scene();

    const defaultLightingIsOn = this.configService.defaultLightingIsOn;
    // INIT LIGHT
    if (defaultLightingIsOn)
    {
      const color = this.configService.defaultlightColor;
      const intensity = this.configService.defaultLightIntensity;
      const light = new THREE.DirectionalLight( color, intensity );
      const X = this.configService.defaultLightPositionX;
      const Y = this.configService.defaultLightPositionY;
      const Z = this.configService.defaultLightPositionZ;
      light.position.set( X, Y, Z);
      scene.add( light );
    }

    // // INIT BALL
    const ball = new Ball(this.configService);
    ball.adToScene(scene);



    // INIT PADDLES
    const paddleWidth = this.configService.paddleWidth;
    const paddleHeight = this.configService.paddleHeight;
    const paddleDepth = this.configService.paddleDepth;
    const paddleGeometry = new THREE.BoxGeometry(paddleWidth, paddleHeight, paddleDepth);
    const paddleColor = this.configService.paddleColor;
    const paddleMaterial = new THREE.MeshPhongMaterial({color: paddleColor});
    const leftPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
    leftPaddle.position.x = this.configService.leftPaddleX;
    leftPaddle.position.y = this.configService.leftPaddleY;
    leftPaddle.rotation.z = this.configService.leftPaddleRotation;
    const rightPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
    rightPaddle.position.x = this.configService.rightPaddleX;
    rightPaddle.position.y = this.configService.rightPaddleY;
    rightPaddle.rotation.z = this.configService.rightPaddleRotation;
    scene.add(leftPaddle);
    scene.add(rightPaddle);
    const paddleSpeed = this.configService.paddleSpeed;

    // INIT WALLS
    const wallWidth = this.configService.wallWidth;
    const wallHeight = this.configService.wallHeight;
    const wallDepth = this.configService.wallDepth;
    const wallGeometry = new THREE.BoxGeometry(wallWidth, wallHeight, wallDepth);
    const wallColor = this.configService.wallColor;
    const wallMaterial = new THREE.MeshPhongMaterial({color: wallColor});
    const topWall = new THREE.Mesh(wallGeometry, wallMaterial);
    topWall.position.x = this.configService.topWallX;
    topWall.position.y = this.configService.topWallY;
    topWall.position.z = this.configService.topWallZ;
    const bottomWall = new THREE.Mesh(wallGeometry, wallMaterial);
    bottomWall.position.x = this.configService.bottomWallX;
    bottomWall.position.y = this.configService.bottomWallY;
    bottomWall.position.z = this.configService.bottomWallZ;
    scene.add(topWall);
    scene.add(bottomWall);

    const IA = this.configService.IAisOn;

    // Init loop variables
    let pastTime = 0;
    let pastIATime = 0;
    let predictedBallY = 0;
    let rightPaddleMovement = 0;
    let leftPaddleMovement = 0;
    const collisionChangeBallColor = this.configService.collisionChangeBallColor;
    const collisionChangeWallColor = this.configService.collisionChangeWallColor;
    const collisionChangePaddleColor = this.configService.collisionChangePaddleColor;
    const aceleration = this.configService.aceleration;
    const friction = this.configService.friction;
    const deltaFactor = this.configService.deltaFactor;
    function render(time: number) {
      time *= 0.001; // convert time to seconds

      // DISPLAY TIME
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
  
      const timeElement = document.getElementById('time');
      if (timeElement) {
          timeElement.innerText = `${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s `;
      }

      // MOVE BALL
      const timeDifference = pastTime - time;
      ball.update(timeDifference);

      // HANDLE PADDLE MOVEMENT
      const pseudoLimit = 1 - ball.radius;
      const paddleDiferentialDisplacement = - timeDifference * paddleSpeed;

      // LEFT PADDLE MOVEMENT
      if (key.isPressed('w') || key.isPressed('a')) {
        leftPaddleMovement = paddleDiferentialDisplacement;
      }
      else if (key.isPressed('s') || key.isPressed('d')) {
        leftPaddleMovement = - paddleDiferentialDisplacement;
      }
      else {
        leftPaddleMovement = 0;
      }

      // RIGHT PADDLE MOVEMENT
      if (IA) {
        if (time - pastIATime > 1) { // IA only sees the ball every second
          console.log('IA');
          pastIATime = time;

          // IA PREDICTION
          predictedBallY = ball.getPosition().y +(Math.tan(ball.getAngle() - Math.PI) * (rightPaddle.position.x - ball.getPosition().x));
          while (predictedBallY > pseudoLimit) {
            predictedBallY = pseudoLimit - (predictedBallY - pseudoLimit);
          }
          while (predictedBallY < -pseudoLimit) {
            predictedBallY = -pseudoLimit - (predictedBallY + pseudoLimit);
          }
          predictedBallY  += (Math.random() - Math.random()) * (paddleWidth - ball.getRadius())/2 ;
          if (ball.getAngle() < Math.PI / 2 || ball.getAngle() > 3 * Math.PI / 2) {
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
      }
      
      // MOVE PADDLES
      leftPaddle.position.y += leftPaddleMovement;
      rightPaddle.position.y += rightPaddleMovement;

      // LIMIT PADDLES
      if (leftPaddle.position.y > topWall.position.y) {
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
      }

      // COLLISION BALL
      // COLLISION BOTTOM WALL
      if (ball.getPosition().y < -pseudoLimit)
      {
        if (collisionChangeBallColor) {
          const color = Math.random() * 0xFFFFFF;
          ball.changeColor(color);
        }
        if (collisionChangeWallColor) {
          bottomWall.material = new THREE.MeshPhongMaterial({color: Math.random() * 0xFFFFFF});
        }
        ball.yCollision(-pseudoLimit);
      }
      // COLLISION TOP WALL
      if (ball.getPosition().y > pseudoLimit)
      {
        if (collisionChangeBallColor) {
          const color = Math.random() * 0xFFFFFF;
          ball.changeColor(color);
        }
        if (collisionChangeWallColor) {
          topWall.material = new THREE.MeshPhongMaterial({color: Math.random() * 0xFFFFFF});
        }
        ball.yCollision(pseudoLimit);
      }
      // COLLISION LEFT PADDLE
      if (ball.getPosition().x < - pseudoLimit && ball.getPosition().y + ball.getRadius() * 3/4  > leftPaddle.position.y - paddleWidth / 2 && ball.getPosition().y - ball.getRadius() * 3/4 < leftPaddle.position.y + paddleWidth / 2) {
        if (collisionChangeBallColor) {
          const color = Math.random() * 0xFFFFFF;
          ball.changeColor(color);
        }
        if (collisionChangePaddleColor) {
          leftPaddle.material = new THREE.MeshPhongMaterial({color: Math.random() * 0xFFFFFF});
        }
        
        const yDifference = (ball.getPosition().y - leftPaddle.position.y) / paddleWidth / 2;
        let newAngle = deltaFactor * yDifference + Math.PI;
        if (leftPaddleMovement > 0)
          newAngle += friction ;
        if (leftPaddleMovement < 0)
          newAngle -= friction;
        ball.xCollision(-pseudoLimit);
        ball.setAngle(newAngle);
      }
      // COLLISION RIGHT PADDLE
      if (ball.getPosition().x > pseudoLimit && ball.getPosition().y + ball.getRadius() * 3/4 > rightPaddle.position.y - paddleWidth / 2 && ball.getPosition().y - ball.getRadius() * 3/4 < rightPaddle.position.y + paddleWidth / 2) {
        if (collisionChangeBallColor) {
          const color = Math.random() * 0xFFFFFF;
          ball.changeColor(color);
        }
        if (collisionChangePaddleColor) {
          rightPaddle.material = new THREE.MeshPhongMaterial({color: Math.random() * 0xFFFFFF});
        }
        
        const yDifference = (ball.getPosition().y - rightPaddle.position.y) / paddleWidth / 2;
        let newAngle = - deltaFactor * yDifference;
        if (rightPaddleMovement > 0)
          newAngle -= friction;
        if (rightPaddleMovement < 0)
          newAngle += friction;
        ball.xCollision(pseudoLimit);
        ball.setAngle(newAngle);
      }

      // SET PAST TIME
      pastTime = time;

      // CHECK WINNER
      if (ball.getPosition().x < leftPaddle.position.x - paddleHeight) {
        alert('Right player wins!');
        window.location.reload();
      }
      if (ball.getPosition().x > rightPaddle.position.x + paddleHeight) {
        alert('Left player wins!');
        window.location.reload();
      }

      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
  
  }
}
