import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as THREE from 'three';
import * as key from 'keymaster'; // Si estás utilizando TypeScript
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

@Component({
  selector: 'app-pong',
  templateUrl: './pong.component.html',
  styleUrls: ['./pong.component.css']
})

export class PongComponent implements AfterViewInit {

  @ViewChild('pongCanvas', { static: true }) pongCanvas!: ElementRef<HTMLCanvasElement>;


  constructor() {
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
    const fov = 75;
    const aspect = 2; // the canvas default
    const near = 0.1;
    const far = 5;
    const camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
    camera.position.z = 2;

    // INIT SCENE
    const scene = new THREE.Scene();

    // INIT LIGHT
    {
  
      const color = colorPalette.white;
      const intensity = 3;
      const light = new THREE.DirectionalLight( color, intensity );
      light.position.set( - 1, 2, 4 );
      scene.add( light );
  
    }

    // INIT BALL
    const radius = 0.1;
    const widthSegments = 32;
    const heightSegments = 16;
    const ballGeometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    const ballMaterial = new THREE.MeshPhongMaterial({color: colorPalette.roseGarden});
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    scene.add(ball);

    let ballSpeed = 0.01;
    let ballAngle = Math.PI * Math.random() / 10;

    // INIT BALL LIGHT
    const color = colorPalette.roseGarden;
    const intensity = 1;
    const light = new THREE.PointLight( color, intensity );
    light.position.set( 0, 0, 0 );
    scene.add( light );

    // INIT PADDLES
    const paddleWidth = 0.3;
    const paddleHeight = 0.02;
    const paddleDepth = 0.1;
    const paddleGeometry = new THREE.BoxGeometry(paddleWidth, paddleHeight, paddleDepth);
    const paddleMaterial = new THREE.MeshPhongMaterial({color: colorPalette.leadCyan});
    const leftPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
    leftPaddle.position.x = -1;
    leftPaddle.rotation.z = Math.PI / 2;
    const rightPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
    rightPaddle.position.x = 1;
    rightPaddle.rotation.z = Math.PI / 2;
    scene.add(leftPaddle);
    scene.add(rightPaddle);
    
    // INIT PADDLE LIGHT
    const paddleLight1 = new THREE.PointLight( colorPalette.leadCyan, intensity );
    paddleLight1.position.set( -1, 0, 0 );
    scene.add( paddleLight1 );
    const paddleLight2 = new THREE.PointLight( colorPalette.leadCyan, intensity );
    paddleLight2.position.set( 1, 0, 0 );
    scene.add( paddleLight2 );


    // INIT WALLS
    const wallWidth = 2;
    const wallHeight = 0.02;
    const wallDepth = 0.2;
    const wallGeometry = new THREE.BoxGeometry(wallWidth, wallHeight, wallDepth);
    const wallMaterial = new THREE.MeshPhongMaterial({color: colorPalette.darkestPurple});
    const topWall = new THREE.Mesh(wallGeometry, wallMaterial);
    topWall.position.y = 1;
    const bottomWall = new THREE.Mesh(wallGeometry, wallMaterial);
    bottomWall.position.y = -1;
    scene.add(topWall);
    scene.add(bottomWall);


    function render(time: number) {
      time *= 0.001; // convert time to seconds

      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
  
      const timeElement = document.getElementById('time');
      if (timeElement) {
          timeElement.innerText = `${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s `;
      }

      // MOVE BALL
      ball.position.x += ballSpeed * Math.cos(ballAngle);
      ball.position.y += ballSpeed * Math.sin(ballAngle);

      // MOVE PADDLES
      if (key.isPressed('w') || key.isPressed('a')) {
        leftPaddle.position.y += 0.01;
      }
      if (key.isPressed('s') || key.isPressed('d')) {
        leftPaddle.position.y -= 0.01;
      }
      if (key.isPressed('up') || key.isPressed('right')) {
        rightPaddle.position.y += 0.01;
      }
      if (key.isPressed('down') || key.isPressed('left')) {
        rightPaddle.position.y -= 0.01;
      }
      if (leftPaddle.position.y > 1) {
        leftPaddle.position.y = 1;
      }
      if (leftPaddle.position.y < -1) {
        leftPaddle.position.y = -1;
      }
      if (rightPaddle.position.y > 1) {
        rightPaddle.position.y = 1;
      }
      if (rightPaddle.position.y < -1) {
        rightPaddle.position.y = -1;
      }

      // MOVE LIGHT
      light.position.x = ball.position.x;
      light.position.y = ball.position.y;
      paddleLight1.position.y = leftPaddle.position.y;
      paddleLight2.position.y = rightPaddle.position.y;


      // COLLISION BALL
      const pseudoLimit = 1 - radius;
      if (ball.position.y < -pseudoLimit || ball.position.y > pseudoLimit) {
        ballAngle = -ballAngle;
      }
      if (ball.position.x < - pseudoLimit && ball.position.y > leftPaddle.position.y - paddleWidth / 2 && ball.position.y < leftPaddle.position.y + paddleWidth / 2) {
        const yDifference = (ball.position.y - leftPaddle.position.y) / paddleWidth / 2;
        ballAngle = Math.PI - ballAngle + yDifference * Math.PI / 4;
        ball.position.x = -pseudoLimit;
        ballSpeed += 0.001;
      }
      if (ball.position.x > pseudoLimit && ball.position.y > rightPaddle.position.y - paddleWidth / 2 && ball.position.y < rightPaddle.position.y + paddleWidth / 2) {
        const yDifference = (ball.position.y - rightPaddle.position.y) / paddleWidth / 2;
        ballAngle = Math.PI - ballAngle - yDifference * Math.PI / 4;
        ball.position.x = pseudoLimit;
        ballSpeed += 0.001;
      }

      // NORMALIZE ANGLE
      while (ballAngle < 0) {
        ballAngle += 2 * Math.PI;
      }
      while (ballAngle > 2 * Math.PI) {
        ballAngle -= 2 * Math.PI;
      }

      // CHECK WINNER
      if (ball.position.x < -1) {
        alert('Right player wins!');
        window.location.reload();
      }
      if (ball.position.x > 1) {
        alert('Left player wins!');
        window.location.reload();
      }

      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
  
  }
}
