export class Player {
   public mesh: THREE.Object3D;
   public params: any;
   public userTextMesh: THREE.Mesh;
   constructor(params: any, userTextMesh?: THREE.Mesh) {
     this.params = params;
     // this.mesh.position.set(position.x, position.y, position.z)
     // this.mesh.rotation.set(rotation.x, rotation.y, rotation.z)
 
     this.userTextMesh = userTextMesh;
   }
 
   setMesh(mesh: THREE.Mesh | THREE.Object3D, position: THREE.Vector3, rotation: THREE.Euler) {
     this.mesh = mesh;
     this.mesh.position.set(position.x, position.y, position.z)
     this.mesh.rotation.set(rotation.x, rotation.y, rotation.z)
   }
 }
 
 export class Bullet {
   public mesh: THREE.Mesh;
   public direction;
   public collision: boolean;
   public isDestroyed: boolean = false;
   constructor(mesh, direction, collision = false) {
     this.mesh = mesh;
     this.direction = direction;
     this.collision = collision;
   }
 }