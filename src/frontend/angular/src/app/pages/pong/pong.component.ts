import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as THREE from 'three';
import ProtoPaddle2 from './classes/ProtoPaddle2';
import ProtoPaddle3 from './classes/ProtoPaddle3';
import ProtoWall from './classes/ProtoWalls';
import ProtoBall from './classes/ProtoBall';
import * as Matter from 'matter-js';
import * as key from 'keymaster'; // Si estás utilizando TypeScript


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
    const engine =  Matter.Engine.create();
    engine.gravity.scale = 0;
    
    const canvas = this.pongCanvas.nativeElement;
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

    const fov = 50;
    const aspect = 2; // the canvas default
    const near = 0.01;
    const far = 10 * 2;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    // const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, -10, 10);
    camera.position.z = 12;

    const scene = new THREE.Scene();

    {
      const color = 0xFFFFFF;
      const intensity = 2;
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(-1, 2, 4);
      const glight = new THREE.DirectionalLight(0x00FF00, 0.7);
      glight.position.set(0, 5, 2);

      // scene.add(light);
      scene.add(glight);
      
    }
    {

      const color = 0xFFFFFF;
      const intensity = 3;
      const light = new THREE.DirectionalLight( color, intensity );
      light.position.set( - 1, 2, 4 );
      scene.add( light );
  
    }
    {

      const color = 0xFF00FF;
      const intensity = 3;
      const light = new THREE.DirectionalLight( color, intensity );
      light.position.set( 0, 0.2, 1 );
      scene.add( light );
  
    }
    {

      const color = 0x00FFFF;
      const intensity = 3;
      const light = new THREE.DirectionalLight( color, intensity );
      light.position.set( 3, 3, 1 );
      scene.add( light );
  
    }
    {

      const color = 0xFFFF00;
      const intensity = 1.1;
      const light = new THREE.DirectionalLight( color, intensity );
      light.position.set( 10, -4, 4 );
      scene.add( light );
  
    }
    {

      const color = 0x0000FF;
      const intensity = 0.3;
      const light = new THREE.DirectionalLight( color, intensity );
      light.position.set( - 1, - 2, 0 );
      scene.add( light );
  
    }
  
    // Create the cube mesh
    const boxWidth = 2;
    const boxHeight = 2;
    const boxDepth = 2;
    const geometry = new THREE.BoxGeometry( boxWidth, boxHeight, boxDepth );
  
    const material = new THREE.MeshPhongMaterial( { color: 0xbbaa11 } ); // greenish blue

    const cube = new THREE.Mesh( geometry, material );
    cube.position.set(0,0,-2);
    // Add the cube to the scene
    scene.add(cube);

    const pp2 = new ProtoPaddle2();
    pp2.setPosition(5, 3 , 0);
    scene.add(pp2.getMesh());
    Matter.Composite.add(engine.world, pp2.getBody());
    
    const pp3 = new ProtoPaddle3();
    scene.add(pp3.getMesh());
    Matter.Composite.add(engine.world, pp3.getBody());
    const pp32 = new ProtoPaddle3();
    scene.add(pp32.getMesh());
    Matter.Composite.add(engine.world, pp32.getBody());

    window.addEventListener('keydown', (event) => {
      // Aquí puedes manejar la lógica según la tecla presionada
      console.log('Tecla presionada:', event.key); 
    });
    pp2.setLeftKey("b");
    pp2.setRightKey("m");
    // pp32.setPosition(10, 1, 0);
    pp3.setPosition(0, 3, 0);
    pp32.setPosition(0, -3, 0);

    const leftWall = new ProtoWall();
    leftWall.setPosition(-10, 0, 0);
    scene.add(leftWall.getMesh());
    Matter.Composite.add(engine.world, leftWall.getBody());
    const rightWall = new ProtoWall();
    rightWall.setPosition(10, 0, 0);
    scene.add(rightWall.getMesh());
    Matter.Composite.add(engine.world, rightWall.getBody());//haz una funcioon de esto que ya lo has copiapegado 5 veces
    // Call render function
    
  //   var constraintOptions = {
  //     bodyA: pp3.getBody(), // Cuerpo que quieres restringir
  //     pointA: { x: 0, y: 0 }, // Punto de anclaje en el cuerpo (en este caso, el centro)
  //     bodyB: undefined, // No hay un segundo cuerpo para conectar (movimiento restringido en un solo cuerpo)
  //     pointB: { x: 0, y: 1 }, // Punto de anclaje en el espacio
  //     length: 0, // Longitud de la restricción (0 para una deslizadera)
  //     stiffness: 1, // Rigidez de la restricción (1 es muy rígido)
  //     damping: 0.1, // Amortiguación para el movimiento (0.1 es un valor moderado)
  //     render: {
  //         visible: true // Opcional: hace que la restricción sea visible para depuración
  //     }
  //   };
  
  // var sliderConstraint = Matter.Constraint.create(constraintOptions);
  
  // // Añadir la restricción al motor de física
  // Matter.Composite.add(engine.world, sliderConstraint);
    
    // Crear la restricción para limitar el movimiento del objeto deslizante
    // var restriccionDeslizante = Matter.Constraint.create({

    //   pointA: { x: 0, y: 100000000000000000 },
    //   bodyB: pp3.getBody(),
    //   stiffness: 1  // Rigidez alta para una restricción firme
    // });

    // Añadir la restricción al mundo
    // Matter.Composite.add(engine.world, pp3.generateConstraint());
    /*const restriccionDeslizante = Matter.Constraint.create({

      pointA: { x: 0, y: 10000000000000 },
      bodyB: pp3.getBody(),
      stiffness: 0.5  // Rigidez alta para una restricción firme
    });*/

    //Añadir la restricción al mundo
    Matter.Composite.add(engine.world, pp3.generateConstraint());
    Matter.Composite.add(engine.world, pp32.generateConstraint());

    pp32.setLeftKey("left");
    pp32.setRightKey("right");

    const bola = new ProtoBall();
    scene.add(bola.getMesh());
    Matter.Composite.add(engine.world, bola.getBody());//haz una funcioon de esto que ya lo has copiapegado mas de 5 veces

    function render( time : number) {
      time *= 0.001; // convert time to seconds
      if (key.isPressed("r"))
      {
        bola.setPosition(0, 0.1, 0);
        Matter.Body.setVelocity(bola.getBody(), {x:0.1, y:0.01});

      }
      // Matter.Body.setSpeed(bola.getBody(), 0.2);
      // Matter.Body.setAngularVelocity(bola.getBody(), 0);
      Matter.Engine.update(engine);
      cube.rotation.x = time;
      cube.rotation.y = time;
      pp2.update();
      pp3.update();
      pp32.update();
      bola.update();//esto hazlo bien tambien
      renderer.render( scene, camera );
    
      requestAnimationFrame( render );
  
    }
  
    requestAnimationFrame( render );
  }
}
