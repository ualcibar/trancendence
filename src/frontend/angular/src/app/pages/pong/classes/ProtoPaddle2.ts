
import * as THREE from 'three';
import * as key from 'keymaster'; // Si estás utilizando TypeScript
import * as Matter from 'matter-js';

const defaultWidth = 2;
const defaultHeight = 0.5;
const defaultDepth = 0.5;

export default class ProtoPaddle2 {
    private mesh: THREE.Mesh;

    private rightKey : string = 'd';
    private leftKey : string = 'a';
  
    private body : Matter.Body;
  
    private defaultGeometry() {
      return new THREE.BoxGeometry(defaultWidth, defaultHeight, defaultDepth);
    }

    private defaultMaterial() {
      const color = 0xffc0cb;

      return new THREE.MeshPhongMaterial({ color });
    }

    constructor() {
        this.mesh = new THREE.Mesh(this.defaultGeometry(), this.defaultMaterial());
        this.body = Matter.Bodies.rectangle(this.mesh.position.x, this.mesh.position.y, defaultWidth, defaultHeight);
    }

    public getMesh(): THREE.Mesh {
        return this.mesh;
    }

    public getBody(): Matter.Body {
      return this.body;
    }
    // necesario? posiblemente
    public setPosition(x: number, y: number, z: number): void {//podria ser un poco mas bonito
      this.mesh.position.set(x, y, z);
      Matter.Body.setPosition(this.body, {x, y});
    }

    public setRightKey(key : string): void {
      this.rightKey = key;
    }

    public setLeftKey(key : string): void {
      this.leftKey = key;
    }

    public getRightKey(): string {
      return this.rightKey;
    }
    
    public getLeftKey(): string {
      return this.leftKey;
    }

    private relativeDirection(direction : THREE.Vector3){
      return direction.applyQuaternion(this.mesh.quaternion);
    }

    private tvtomv(tv : THREE.Vector3){
      const mv = Matter.Vector.create(tv.x, tv.y);
      return mv;
    }

    private move(direction : THREE.Vector3){
      // const speed = 0.5;
      const baseforce = 0.000000004 * 2
  
      // this.mesh.position.addScaledVector(this.relativeDirection(direction), speed);
      console.log('epi');

      Matter.Body.applyForce(this.body, this.body.position, Matter.Vector.mult(this.tvtomv(this.relativeDirection(direction)), baseforce));
    }

    private moveRight(){
      const right = new THREE.Vector3(1, 0, 0)
      this.move(right);
    }

    private moveLeft(){
      const left = new THREE.Vector3(-1, 0, 0)
      this.move(left);
    }

    private updatePosition(){
      this.mesh.position.set(this.body.position.x, this.body.position.y, this.mesh.position.z);
    }

    private updateRotation() {//for debugging only?
      this.mesh.rotation.z = this.body.angle;
      console.log(this.body.angle, " = ", this.mesh.rotation.z)
    }

    private handleMovement() {
      if (key.isPressed(this.rightKey)) {
          this.moveRight();
      }
      if (key.isPressed(this.leftKey)) {
          this.moveLeft();
      }
    }

    public update() {
      this.handleMovement();
      
        //luego borra esto
        // if (key.isPressed("z"))
        // this.mesh.rotation.z -= 0.1;
        // if (key.isPressed("x"))
        //   this.mesh.rotation.x += 0.1;
        // if (key.isPressed("y"))
        //   this.mesh.rotation.y += 0.1;
      
      this.updatePosition();
      this.updateRotation();

        // console.log(this.body.position.x, this.body.position.y, this.mesh.position.z);
        // console.log("this.body.force", this.body.force);
        // console.log("this.body.speed", this.body.speed);
        // console.log("this.body.velocity", this.body.velocity);
        // console.log("this.body.motion", this.body.motion);

    }
}

// class ProtoPaddle {
//   private mesh: THREE.Mesh;
//   // private paddleWidth: number;
//   // private paddleHeight: number;
//   // private paddleDepth: number;

//   private defaultGeometry() {
//     const defaultWidth = 2;
//     const defaultHeight = 0.5;
//     const defaultDepth = 0.5;

//     return new THREE.BoxGeometry(defaultWidth, defaultHeight, defaultDepth);
//   }

//   private defaultMaterial() {
//     return new THREE.MeshBasicMaterial({ color: 0xffffff });
//   }

//   constructor() {
//       // Crear la paleta (mesh) utilizando la geometría y el material
//       this.mesh = new THREE.Mesh(this.defaultGeometry(), this.defaultMaterial());
//   }

//   // Método para obtener la paleta (mesh)
//   public getMesh(): THREE.Mesh {
//       return this.mesh;
//   }

//   // Método para mover la paleta a una nueva posición
//   public setPosition(x: number, y: number, z: number): void {
//       this.mesh.position.set(x, y, z);
//   }

//   // Otros métodos para interacción, animación, etc. pueden ser añadidos aquí según sea necesario
//   public followMouse(canvas: HTMLCanvasElement, camera: THREE.Camera): void {//ñeh
//     canvas.addEventListener('mousemove', (event) => {
//         // Obtener la posición del ratón en el canvas
//         const rect = canvas.getBoundingClientRect();
//         const mouseX = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
//         const mouseY = -((event.clientY - rect.top) / canvas.height) * 2 + 1;

//         // Convertir la posición del ratón en coordenadas del mundo
//         const vector = new THREE.Vector3(mouseX, mouseY, 1);
//         vector.unproject(camera);
//         // Establecer la posición de la paleta en la posición del ratón en el plano XY
//         // this.mesh.position.x = (vector.x);
//         this.mesh.position.y = (vector.y);
//         this.mesh.position.z = vector.z;
//     });
// }
// public addKeyboardEvents(): void {
//   window.addEventListener('keydown', (event) => {
//     if (event.key == "a")
//       this.mesh.position.x -= 1;
//     if (event.key == "d")
//       this.mesh.position.x += 1;
//     if (event.key == "s")
//       this.mesh.position.y -= 1;
//     if (event.key == "w")
//       this.mesh.position.y += 1;
//     if (event.key == "q")
//       this.mesh.position.z -= 1;
//     if (event.key == "e")
//       this.mesh.position.z += 1;
//       if (event.key == "z")
//       this.mesh.rotation.z -= 1;
//     if (event.key == "x")
//       this.mesh.rotation.x += 1;
//     if (event.key == "y")
//       this.mesh.rotation.y += 1;
//   });
// }
// }
