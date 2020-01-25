import SocketService from "./socket.service";
import * as THREE from 'three';

export function asteroidCollision() {
   // players
   // .filter(r => r.mesh)
   // .forEach(player => {
   //   let plMesh = player.mesh
   //   let originPoint = plMesh.position.clone()

   //   for (
   //     let vertexIndex = 0;
   //     vertexIndex < plMesh.geometry.vertices.length;
   //     vertexIndex++
   //   ) {
   //     let localVertex = plMesh.geometry.vertices[vertexIndex].clone()
   //     let globalVertex = localVertex.applyMatrix4(plMesh.matrix)
   //     let directionVector = globalVertex.sub(plMesh.position)
   //     let ray = new THREE.Raycaster(
   //       originPoint,
   //       directionVector.clone().normalize()
   //     )

   //     let collisionResults = ray.intersectObjects(bullets.map(r => r.mesh))
   //     if (
   //       collisionResults.length > 0 &&
   //       collisionResults[0].distance <= directionVector.length()
   //     ) {
   //       let obj = collisionResults[0].object
         
   //       if (obj.id !== lastBulletCollisionId) {
   //         lastBulletCollisionId = obj.id
           
   //         SocketService.socket.emit('damage', player.user, currentUser)
   //         const volume = getVolumeFromDistance(MainPlayer, plMesh);
   //         worker.post({type: 'damageDone', volume: volume})

   //         obj.remove()
   //       }
   //     }
   //   }
   // })
}
let lastCollisionId;
export function runesCollisionDetection(MainPlayer, allRunes) {
   let originPoint = MainPlayer.position.clone()

   for (
     let vertexIndex = 0;
     vertexIndex < MainPlayer.geometry.vertices.length;
     vertexIndex++
   ) {
     let localVertex = MainPlayer.geometry.vertices[vertexIndex].clone()
     let globalVertex = localVertex.applyMatrix4(MainPlayer.matrix)
     let directionVector = globalVertex.sub(MainPlayer.position)
     let ray = new THREE.Raycaster(
       originPoint,
       directionVector.clone().normalize()
     )
     let collisionResults = ray.intersectObjects(allRunes)
     if (
       collisionResults.length > 0 &&
       collisionResults[0].distance <= directionVector.length()
     ) {
       let obj = collisionResults[0].object
       if (obj.id !== lastCollisionId) {
         // console.log(obj.id);
         lastCollisionId = obj.id
 
         // obj.material.opacity = 0.4;
         // obj.material.transparent = true;
         // scene.remove(obj);

         SocketService.socket.emit('removeRune', obj.userData)
         // SocketService.socket.emit('increaseScores')
       }
     }
   }
}