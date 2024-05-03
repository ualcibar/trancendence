import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GameConfigService {

  public readonly colorPalette = {
    darkestPurple: 0x1C0658,
    swingPurple: 0x5C2686,
    roseGarden: 0xFF1690,
    josefYellow: 0xF4D676,
    leadCyan: 0x36CDC4,
    white: 0xFFFFFF,
    black: 0x000000,
  };

  // General game settings
    gameHeight = 2;
    gameWidth = 2;

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
    public readonly ballColor = this.colorPalette.josefYellow;

    // Quinetity settings
    public readonly ballSpeed = 0.77;
    public readonly ballAngle = 0;

      // Ball light settings
      public readonly ballLightColor = this.ballColor;
      public readonly ballLightIntensity = 0.5;

  // Paddle settings
    // Constructor settings
    public readonly paddleWidth = 0.5;
    public readonly paddleHeight = 0.02;
    public readonly paddleDepth = 0.1;
    public readonly paddleColor = this.colorPalette.white;

    // Paddle position
      // Left paddle
      public readonly leftPaddleX = - this.gameWidth / 2;
      public readonly leftPaddleY = 0;
      public readonly leftPaddleRotation = Math.PI / 2; // 90 degrees, don't change this
      // Right paddle
      public readonly rightPaddleX = this.gameWidth / 2;
      public readonly rightPaddleY = 0;
      public readonly rightPaddleRotation = Math.PI / 2; // 90 degrees, don't change this

  // Wall settings
    // Constructor settings
    public readonly wallWidth = 2 - this.paddleHeight * 2;
    public readonly wallHeight = 0.02;
    public readonly wallDepth = 0.2;
    public readonly wallColor = this.colorPalette.white;

    // Wall position
      // Top wall
      public readonly topWallX = 0;
      public readonly topWallY = this.gameHeight / 2;
      public readonly topWallZ = 0;
      // Bottom wall
      public readonly bottomWallX = 0;
      public readonly bottomWallY = - this.gameHeight / 2;
      public readonly bottomWallZ = 0;

    // IA settings
      public readonly IAisOn = true;

  constructor() { }
}
