import SocketService from "../services/socket.service";
import * as THREE from 'three';
import { getVolumeFromDistance } from "./utils";
import { IBullet } from "../interfaces/interfaces";
import { Player, Bullet } from "./models";

/**
 * deprecated
 */
// function detectCollisionCubes(object1: THREE.Mesh, object2: THREE.Mesh){
//   if(object1 instanceof THREE.Group || object2 instanceof THREE.Group) {
//     return;
//   }
//    object1.geometry.computeBoundingBox(); //not needed if its already calculated
//    object2.geometry.computeBoundingBox();
//    object1.updateMatrixWorld();
//    object2.updateMatrixWorld();

//    var box1 = object1.geometry.boundingBox.clone();
//    box1.applyMatrix4(object1.matrixWorld);

//    var box2 = object2.geometry.boundingBox.clone();
//    box2.applyMatrix4(object2.matrixWorld);

//    return box1.intersectsBox(box2);
//  }

function detectCollision(object1, object2List) {
    let originPoint = object1.position.clone();
    for (let vertexIndex = 0; vertexIndex < object1.geometry.vertices.length; vertexIndex++) {
        let localVertex = object1.geometry.vertices[vertexIndex].clone();

        let globalVertex = localVertex.applyMatrix4(object1.matrix);
        let directionVector = globalVertex.sub(object1.position);

        let ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
        let collisionResults = ray.intersectObjects(object2List);
        if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
            return collisionResults[0].object;
        }
    }
    return false;
}


let lastBulletWithAsteroidCollisionId;
export function asteroidWithBulletCollision(scene: THREE.Scene, asteroids: THREE.Mesh[], bullets: IBullet[], player: Player, worker) {
    let toDispose = [];
    bullets
        .forEach((bullet, index) => {
            if (!bullet.notifyServer) return;
            const bulletMesh = bullet.mesh;
            let asteroid = detectCollision(bullet.mesh, asteroids);

            if (asteroid) {
                if (bulletMesh.id !== lastBulletWithAsteroidCollisionId) {

                    scene.remove(bulletMesh);
                    toDispose.push(index);
                    lastBulletWithAsteroidCollisionId = bulletMesh.id;

                    // if(bullet.notifyServer) {
                    SocketService.socket.emit('damageToAsteroid', asteroid.userData.id)
                    // }

                    const volume = getVolumeFromDistance(player.mesh, asteroid);
                    worker.post({ type: 'damageDone', volume: volume })
                }
            }
        })

    toDispose.forEach(index => {
        bullets.splice(index, 1)
    })
}
let lastRuneCollisionId;
export function runesCollisionDetection(player: Player, allRunes: THREE.Mesh[], worker) {

    allRunes.forEach(rune => {
        let pl: any = detectCollision(rune, [player.mesh.children[0]]);

        if (pl) {
            if (rune.id !== lastRuneCollisionId) {
                lastRuneCollisionId = rune.id;
                SocketService.socket.emit('removeRune', rune.userData)
                worker.post({ type: 'removeRune', volume: 0.5 })
            }
        }
    })

}

let lastBulletWithEnemyCollisionId;
export function bulletsWithEnemyCollisionDetection(scene: THREE.Scene, players: Player[], bullets: Bullet[], player: Player, worker) {
    let toDispose = [];
    bullets
        .forEach((bullet, index) => {
            if (!bullet.notifyServer) return;
            const bulletMesh = bullet.mesh;
            let pl: any = detectCollision(bullet.mesh, players.map(r => r.mesh.children[0]));

            if (pl) {
                if (bulletMesh.id !== lastBulletWithEnemyCollisionId) {
                    scene.remove(bulletMesh);
                    toDispose.push(index);
                    lastBulletWithEnemyCollisionId = bulletMesh.id;

                    const enemy = players.find(r => r.mesh == pl.parent);
                    // if(bullet.notifyServer) {
                    SocketService.socket.emit('damage', enemy.params, player.params)
                    // }

                    const volume = getVolumeFromDistance(player.mesh, pl);
                    worker.post({ type: 'damageDone', volume: volume })
                }
            }
        })

    toDispose.forEach(index => {
        bullets.splice(index, 1)
    })
}