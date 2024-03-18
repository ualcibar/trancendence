
import * as THREE from 'three';
import * as Matter from 'matter-js';

const defaultWidth = 0.5;
const defaultHeight = 10;
const defaultDepth = 1;

export default class ProtoWall {
    private mesh: THREE.Mesh;
  
    private body : Matter.Body;
  
    private defaultGeometry() {
      return new THREE.BoxGeometry(defaultWidth, defaultHeight, defaultDepth);
    }

    private defaultMaterial() {
      const color = 0xddcc66;

      return new THREE.MeshPhongMaterial({ color });
    }

    constructor() {
        this.mesh = new THREE.Mesh(this.defaultGeometry(), this.defaultMaterial());
        this.body = Matter.Bodies.rectangle(this.mesh.position.x, this.mesh.position.y, defaultWidth, defaultHeight, {isStatic: true});
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

    private tvtomv(tv : THREE.Vector3){//esto deberia ser de una biblioteca aparte o algo
      const mv = Matter.Vector.create(tv.x, tv.y);
      return mv;
    }
}