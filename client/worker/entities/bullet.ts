import * as THREE from 'three'
import socketService from '../../services/socket.service';


function createBullet(): THREE.Mesh {
    const bullet = new THREE.Mesh(
        new THREE.BoxGeometry(10, 10, 500),
        new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1 })
    )

    return bullet;
}
// const ray = new THREE.Ray();
// const intersectionPoint = new THREE.Vector3();
// const normal = new THREE.Vector3();

export class Bullet {
    public mesh: THREE.Mesh = createBullet();
    public direction: THREE.Vector3;
    public collision: boolean;
    public isDestroyed: boolean = false;
    readonly bulletSpeed: number = 1000;

    public currentTime: number = 0;
    readonly lifetime: number = 2; //4 sec
    // public ray = new THREE.Ray();

    constructor(player, collision = false) {
        let position = player.mesh.position.clone()
        let rotation = player.mesh.rotation.clone()
        const playerPos = player.mesh.position.clone()
        const matrixWorld = player.mesh.matrixWorld.clone()

        const { x: px, y: py, z: pz } = position;
        const { x: rx, y: ry, z: rz } = rotation;

        this.collision = collision;

        this.mesh.position.set(px, py, pz)
        this.mesh.rotation.set(rx, ry, rz)

        this.direction = this.getDirectionOfBullet(matrixWorld, playerPos);

        socketService.socket.emit('fire', {
            userId: player.params._id,
            direction: this.direction,
            position: position,
            rotation: rotation
        })
    }


    update(world, delta) {
        this.currentTime += delta;
        if (this.currentTime > this.lifetime) {
            if (this.mesh.parent) {
                world.scene.remove(this.mesh);
            }
            world.bullets = world.bullets.filter(b => b.mesh.id !== this.mesh.id);
            // console.log('ok');
        } else {
            const dir = this.direction.clone();
            this.mesh.position.add(dir.multiplyScalar(this.bulletSpeed))
        }
    }


    getDirectionOfBullet(matrixWorld, camPos) {
        //Pick a point in front of the camera in camera space:
        const pLocal = new THREE.Vector3(0, 0, -1)
        // //Now transform that point into world space:
        const pWorld = pLocal.applyMatrix4(matrixWorld)
        // //You can now construct the desired direction vector:
        const dir = pWorld.sub(camPos).normalize()
        return dir;
    }
}