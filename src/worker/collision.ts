import SocketService from "../services/socket.service";
import * as THREE from 'three';
import { getVolumeFromDistance } from "./utils";

/**
 * deprecated
 */
function detectCollisionCubes(object1: THREE.Mesh, object2: THREE.Mesh){
  if(object1 instanceof THREE.Group || object2 instanceof THREE.Group) {
    return;
  }
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

 function detectCollision(object1, object2List) {
     let originPoint = object1.position.clone();
     for (let vertexIndex = 0; vertexIndex < object1.geometry.vertices.length; vertexIndex++)
     {
         let localVertex = object1.geometry.vertices[vertexIndex].clone();
         let globalVertex = localVertex.applyMatrix4( object1.matrix );
         let directionVector = globalVertex.sub( object1.position );

         let ray = new THREE.Raycaster( originPoint, directionVector.clone().normalize() );
         let collisionResults = ray.intersectObjects( object2List );
         if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ) {
            return collisionResults[0].object;
         }
     }
     return false;
 }

 
let lastBulletWithAsteroidCollisionId;
export function asteroidCollision(scene: THREE.Scene, asteroids: THREE.Mesh[], bullets, player, worker) {
    bullets.forEach(bullet=> {
        const bulletMesh =  bullet.mesh;
        let asteroid = detectCollision(bullet.mesh, asteroids);
        if(asteroid) {
            if(bulletMesh.id !== lastBulletWithAsteroidCollisionId) {
                scene.remove(bulletMesh);
                lastBulletWithAsteroidCollisionId = bulletMesh.id;
                SocketService.socket.emit('damageToAsteroid', asteroid.userData)

                const volume = getVolumeFromDistance(player.mesh, asteroid);
                worker.post({type: 'damageDone', volume: volume})
            }
        }
    })
}
let lastRuneCollisionId;
export function runesCollisionDetection(player, allRunes: THREE.Mesh[], worker) {
  
  allRunes.forEach(rune=> {
    const obj =  rune;
    if(detectCollisionCubes(rune, player.mesh)) {
        if(obj.id !== lastRuneCollisionId) {
          lastRuneCollisionId = obj.id
          SocketService.socket.emit('removeRune', obj.userData)
          worker.post({type: 'removeRune', volume: 0.5})
        }
    }
  });

}

let lastBulletWithEnemyCollisionId;
export function damageCollisionDetection (scene: THREE.Scene, players, bullets, player, worker) {
  players
  .filter(r => r.mesh)
  .forEach(pl => {
    let plMesh = pl.mesh
    bullets.forEach(r=> {
      let bulletMesh = r.mesh;
      if(detectCollisionCubes(bulletMesh, plMesh)) {
          if(lastBulletWithEnemyCollisionId !== bulletMesh.id) {
            scene.remove(bulletMesh);
            lastBulletWithEnemyCollisionId = bulletMesh.id

            SocketService.socket.emit('damage', pl.params, player.params)
            const volume = getVolumeFromDistance(player.mesh, plMesh);
            worker.post({type: 'damageDone', volume: volume})
          }
      }
    })
  })
 }