
import * as THREE from 'three';
import * as Matter from 'matter-js';

const defaultWidth = 0.3;
const defaultHeight = 0.3;
const defaultDepth = 0.3;

export default class ProtoBall {
    private mesh: THREE.Mesh;
  
    private body : Matter.Body;
  
    private defaultGeometry() {
    //   return new THREE.BoxGeometry(defaultWidth, defaultHeight, defaultDepth);
      return new THREE.SphereGeometry(defaultWidth);
    }

    private defaultMaterial() {
      const color = 0xffffff;

      return new THREE.MeshPhongMaterial({ color });
    }

    constructor() {
        this.mesh = new THREE.Mesh(this.defaultGeometry(), this.defaultMaterial());
        // this.body = Matter.Bodies.rectangle(this.mesh.position.x, this.mesh.position.y, defaultWidth, defaultHeight, {frictionAir: 0, restitution : 1, mass :0.01});
        this.body = Matter.Bodies.circle(this.mesh.position.x, this.mesh.position.y, defaultWidth, {inertia: 0, frictionAir: 0, restitution : 1.05, friction : 0, frictionStatic : 0});
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
    private updatePosition(){
        this.mesh.position.set(this.body.position.x, this.body.position.y, this.mesh.position.z);
      }
      private updateRotation() {//for debugging only?
        this.mesh.rotation.z = this.body.angle;
        console.log(this.body.angle, " = ", this.mesh.rotation.z)
      }
    public update() {
        
        this.updatePosition();
        this.updateRotation();
          console.log("⚾︎", this.body.position.x, this.body.position.y, this.mesh.position.z);
          // console.log("this.body.force", this.body.force);
          // console.log("this.body.speed", this.body.speed);
          // console.log("this.body.velocity", this.body.velocity);
          // console.log("this.body.motion", this.body.motion);
  
      }
}