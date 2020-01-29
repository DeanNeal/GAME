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
   public matrixWorld;
   public camPos;
   public notifyServer: boolean;
   constructor(mesh, matrixWorld, camPos, notifyServer = false) {
     this.mesh = mesh;
     this.matrixWorld = matrixWorld;
     this.camPos = camPos;
     this.notifyServer = notifyServer;
   }
 }