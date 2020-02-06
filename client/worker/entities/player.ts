import * as THREE from 'three'
import { Fire } from '../three/objects/Fire';
import { randomDecemal } from '../utils';

export class Player {
    public mesh: THREE.Object3D;
    public params: any;
    public userTextMesh: THREE.Mesh;
    public fire;
    public speed = 0;
    public currentTime = 0;
    public lifetimeOfParticle = 1;
    public maxSpeed = 100;

    constructor(params: any, mesh: THREE.Mesh | THREE.Object3D, userTextMesh: boolean = false, assets) {
        const { position, rotation, shipType } = params;
        this.params = params;
        this.mesh = mesh;
        this.mesh.position.set(position.x, position.y, position.z)
        this.mesh.rotation.set(rotation.x, rotation.y, rotation.z)

        // this.userTextMesh = userTextMesh;
        if (userTextMesh) {

            const font = assets.helvetiker_font;

            const textGeo = new THREE.TextGeometry(params.playerName, {
                font: font,
                size: 20,
                height: 1,
                bevelEnabled: false,
                bevelThickness: 1,
                bevelSize: 0.01,
                bevelSegments: 10,
            })

            let material = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
            })

            this.userTextMesh = new THREE.Mesh(textGeo, material)
        }

        this.addFire(assets);
    }

    addFire(assets) {

        const particleCount = 200,
            particles = new THREE.Geometry(),
            pMaterial = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 5,
                // map: assets.particle,
                blending: THREE.AdditiveBlending,
                transparent: true
            });

        const angle = 0.05;
        // now create the individual particles
        for (var p = 0; p < particleCount; p++) {

            // var pX = Math.random() > 0.5 ? angle * randomDecemal(1, 10) : -angle * randomDecemal(1, 10),
            //     pY = Math.random() > 0.5 ? angle * randomDecemal(1, 10) : -angle * randomDecemal(1, 10),
            //     pZ = randomDecemal(1, 2),//Math.random() * 5 - 2,
            var particle = new THREE.Vector3(0, 0, 0)
            particle['init'] = {
                x: Math.random() > 0.5 ? angle * randomDecemal(0.3, 3) : -angle * randomDecemal(0.3, 3),
                y: Math.random() > 0.5 ? angle * randomDecemal(0.3, 3) : -angle * randomDecemal(0.3, 3),
                z: randomDecemal(1, 2)
            }
            // add it to the geometry
            particles.vertices.push(particle);
        }

        this.fire = new THREE.Points(particles, pMaterial);
        this.fire.position.set(0, 0, 40);
        // particleSystem.sortParticles = true;

        this.mesh.add(this.fire);
    }

    update(delta) {
        this.currentTime += delta;
        const angle = 0.05;
        let pCount = this.fire.geometry['vertices'].length;
        let correlation = (pCount / this.maxSpeed) * this.speed;

        for (let i = 0; i < pCount; i++) {
            const particle = this.fire.geometry['vertices'][i];
            const direction = particle.clone().normalize();

            particle.add(direction.multiplyScalar(this.speed / 5 * randomDecemal(1, 2)));

            if (Math.abs(particle.z) > 400 || i > correlation) {
                particle.x = particle.init.x;
                particle.y = particle.init.y;
                particle.z = particle.init.z;

            }
        }

        // }
        // this.mesh.material['opacity'] -= 0.01;
        this.fire.geometry['verticesNeedUpdate'] = true;
        // flag to the particle system
        // that we've changed its vertices.
        this.fire.geometry['__dirtyVertices'] = true;

    }
}