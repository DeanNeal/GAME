import SocketService from "./socket.service";
import * as THREE from 'three';
import { getVolumeFromDistance } from "./utils";

function detectCollisionCubes(object1, object2){
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
export function asteroidCollision(asteroids, bullets, MainPlayer, worker) {

  asteroids.forEach(asteroid=> {
      bullets.forEach(bullet=> {
         const obj =  bullet.mesh;
         if(detectCollisionCubes(asteroid, obj)) {
            if(obj.id !== lastBulletWithAsteroidCollisionId) {
               obj.remove();
               lastBulletWithAsteroidCollisionId = obj.id;
               SocketService.socket.emit('damageToAsteroid', asteroid.userData)

               const volume = getVolumeFromDistance(MainPlayer, asteroid);
               worker.post({type: 'damageDone', volume: volume})
            }
         }
      })
  })
}
let lastRuneCollisionId;
export function runesCollisionDetection(MainPlayer, allRunes, worker) {
  
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
export function damageCollisionDetection (players, bullets, currentUser, MainPlayer, worker) {
   players
     .filter(r => r.mesh)
     .forEach(player => {
       let plMesh = player.mesh
       let originPoint = plMesh.position.clone()
 
       for (
         let vertexIndex = 0;
         vertexIndex < plMesh.geometry.vertices.length;
         vertexIndex++
       ) {
         let localVertex = plMesh.geometry.vertices[vertexIndex].clone()
         let globalVertex = localVertex.applyMatrix4(plMesh.matrix)
         let directionVector = globalVertex.sub(plMesh.position)
         let ray = new THREE.Raycaster(
           originPoint,
           directionVector.clone().normalize()
         )
 
         let collisionResults = ray.intersectObjects(bullets.map(r => r.mesh))
         if (
           collisionResults.length > 0 &&
           collisionResults[0].distance <= directionVector.length()
         ) {
           let obj = collisionResults[0].object
           
           if (obj.id !== lastBulletWithEnemyCollisionId) {
             obj.remove()
             lastBulletWithEnemyCollisionId = obj.id
             
             SocketService.socket.emit('damage', player.user, currentUser)
             const volume = getVolumeFromDistance(MainPlayer, plMesh);
             worker.post({type: 'damageDone', volume: volume})
           }
         }
       }
     })
 }