import SocketService from "../services/socket.service";
import * as THREE from 'three';
import { getVolumeFromDistance } from "./utils";

function detectCollisionCubes(object1: THREE.Mesh, object2: THREE.Mesh){
   object1.geometry.computeBoundingBox(); //not needed if its already calculated
   object2.geometry.computeBoundingBox();
   object1.updateMatrixWorld();
   object2.updateMatrixWorld();
   
   var box1 = object1.geometry.boundingBox.clone();
   box1.applyMatrix4(object1.matrixWorld);
 
   var box2 = object2.geometry.boundingBox.clone();
   box2.applyMatrix4(object2.matrixWorld);
 
   return box1.intersectsBox(box2);
 }

 
let lastBulletWithAsteroidCollisionId;
export function asteroidCollision(scene: THREE.Scene, asteroids: THREE.Mesh[], bullets, MainPlayer, worker) {

  asteroids.forEach(asteroid=> {
      bullets.forEach(bullet=> {
         const bulletMesh =  bullet.mesh;
         if(detectCollisionCubes(asteroid, bulletMesh)) {
            if(bulletMesh.id !== lastBulletWithAsteroidCollisionId) {
              scene.remove(bulletMesh);
               lastBulletWithAsteroidCollisionId = bulletMesh.id;
               SocketService.socket.emit('damageToAsteroid', asteroid.userData)

               const volume = getVolumeFromDistance(MainPlayer, asteroid);
               worker.post({type: 'damageDone', volume: volume})
            }
         }
      })
  })
}
let lastRuneCollisionId;
export function runesCollisionDetection(MainPlayer, allRunes: THREE.Mesh[], worker) {
  
  allRunes.forEach(rune=> {
    const obj =  rune;
    if(detectCollisionCubes(rune, MainPlayer)) {
        if(obj.id !== lastRuneCollisionId) {
          lastRuneCollisionId = obj.id
          SocketService.socket.emit('removeRune', obj.userData)
          worker.post({type: 'removeRune', volume: 0.5})
        }
    }
  });

}

let lastBulletWithEnemyCollisionId;
export function damageCollisionDetection (scene: THREE.Scene, players, bullets, currentUser, MainPlayer, worker) {
  players
  .filter(r => r.mesh)
  .forEach(player => {
    let plMesh = player.mesh
    bullets.forEach(r=> {
      let bulletMesh = r.mesh;
      if(detectCollisionCubes(bulletMesh, plMesh)) {
          if(lastBulletWithEnemyCollisionId !== bulletMesh.id) {
            scene.remove(bulletMesh);
            lastBulletWithEnemyCollisionId = bulletMesh.id

            SocketService.socket.emit('damage', player.user, currentUser)
            const volume = getVolumeFromDistance(MainPlayer, plMesh);
            worker.post({type: 'damageDone', volume: volume})
          }
      }
    })
  })
 }