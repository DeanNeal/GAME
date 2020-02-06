import SocketService from "../services/socket.service";
import * as THREE from 'three';
import { Player } from "./entities/player";


function detectCollision(object1, object2List) {
    let originPoint = object1.position.clone();
    for (let vertexIndex = 0; vertexIndex < object1.geometry.vertices.length; vertexIndex++) {
        let localVertex = object1.geometry.vertices[vertexIndex].clone();

        let globalVertex = localVertex.applyMatrix4(object1.matrix);
        let directionVector = globalVertex.sub(object1.position.clone());

        let raycaster = new THREE.Raycaster(originPoint, directionVector.clone().normalize());

        let collisionResults = raycaster.intersectObjects(object2List);

        if (collisionResults.length > 0 && collisionResults[0].distance <= directionVector.length()) {
            return collisionResults[0];
        }
    }
    return false;
}

let lastRuneCollisionId;
export function runesCollisionDetection(player: Player, allRunes: THREE.Mesh[]) {

    allRunes.forEach(rune => {
        let collision: any = detectCollision(rune, [player.mesh.children[0]]);
        let pl = collision.object;
        if (pl) {
            if (rune.id !== lastRuneCollisionId) {
                lastRuneCollisionId = rune.id;
                SocketService.socket.emit('removeRune', rune.userData.id)
            }
        }
    })

}

let lastBulletCollision;
export function bulletCollision(obstacles, bullets, context) {
    bullets
        .forEach((bullet) => {
            const bulletMesh = bullet.mesh;
            let collision: any = detectCollision(bullet.mesh, obstacles);
            let obstacle = collision.object;

            if (obstacle) {
                if (bulletMesh.id !== lastBulletCollision) {

                    context.scene.remove(bulletMesh);
                    bullet.isDestroyed = true;
                    lastBulletCollision = bulletMesh.id;

                    if (obstacle.name === 'asteroid') {
                        SocketService.socket.emit('damageToAsteroid', { id: obstacle.userData.id, collisionPosition: collision.point })
                    }

                    if (obstacle.parent.name === 'ship') {
                        SocketService.socket.emit('damageToEnemy', obstacle.userData.id, context.player.params._id, collision.point)
                    }

                }
            }
        })
}