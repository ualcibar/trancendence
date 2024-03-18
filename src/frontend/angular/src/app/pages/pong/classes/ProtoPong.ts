import * as THREE from 'three';
// import * as key from 'keymaster';
import * as Matter from 'matter-js';

const fov = 75;
const aspect = 2; // the canvas default
const near = 0.1;
const far = 10 * 2;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
// const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, -10, 10);
camera.position.z = 5 * 2;

export default class ProtoPong {
    private engine =  Matter.Engine.create({gravity: { scale: 0 }});
    private canvas;
    private renderer;

}


// export class PongComponent implements AfterViewInit {

//     @ViewChild('pongCanvas', { static: true }) pongCanvas!: ElementRef<HTMLCanvasElement>;
  
  
//     constructor() {
//     }
  
//     ngAfterViewInit(): void {
//       this.main();
//     }
  
//     main() {
//       const engine =  Matter.Engine.create();
//       engine.gravity.scale = 0;
      
//       const canvas = this.pongCanvas.nativeElement;
//       const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  
//       const fov = 75;
//       const aspect = 2; // the canvas default
//       const near = 0.1;
//       const far = 10 * 2;
//       const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
//       // const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, -10, 10);
//       camera.position.z = 5 * 2;
  
//       const scene = new THREE.Scene();
  
//       {
//         const color = 0xFFFFFF;
//         const intensity = 2;
//         const light = new THREE.DirectionalLight(color, intensity);
//         light.position.set(-1, 2, 4);
//         const glight = new THREE.DirectionalLight(0x00FF00, 0.7);
//         glight.position.set(0, 5, 2);
  
//         // scene.add(light);
//         scene.add(glight);
        
//       }
//       {
  
//         const color = 0xFFFFFF;
//         const intensity = 3;
//         const light = new THREE.DirectionalLight( color, intensity );
//         light.position.set( - 1, 2, 4 );
//         scene.add( light );
    
//       }
    
//       // Create the cube mesh
//       const boxWidth = 2;
//       const boxHeight = 2;
//       const boxDepth = 2;
//       const geometry = new THREE.BoxGeometry( boxWidth, boxHeight, boxDepth );
    
//       const material = new THREE.MeshPhongMaterial( { color: 0xbbaa11 } ); // greenish blue
  
//       const cube = new THREE.Mesh( geometry, material );
//       cube.position.set(0,0,-2);
//       // Add the cube to the scene
//       scene.add(cube);
  
//       const pp2 = new ProtoPaddle2();
//       pp2.setPosition(5, 0, 0);
//       scene.add(pp2.getMesh());
//       Matter.Composite.add(engine.world, pp2.getBody());
      
//       const pp3 = new ProtoPaddle3();
//       scene.add(pp3.getMesh());
//       Matter.Composite.add(engine.world, pp3.getBody());
//       const pp32 = new ProtoPaddle3();
//       scene.add(pp32.getMesh());
//       Matter.Composite.add(engine.world, pp32.getBody());
  
//       window.addEventListener('keydown', (event) => {
//         // Aquí puedes manejar la lógica según la tecla presionada
//         console.log('Tecla presionada:', event.key); 
//       });
//       pp2.setLeftKey("b");
//       pp2.setRightKey("m");
//       pp32.setPosition(10, 0, 0);
  
//       // Call render function
      
//       function render( time : number) {
//         time *= 0.001; // convert time to seconds
        
//         Matter.Engine.update(engine);
//         cube.rotation.x = time;
//         cube.rotation.y = time;
//         pp2.update();
//         pp3.update();
//         pp32.update();
//         renderer.render( scene, camera );
      
//         requestAnimationFrame( render );
    
//       }
    
//       requestAnimationFrame( render );
//     }
//   }