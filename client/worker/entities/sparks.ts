import * as THREE from 'three'

export class Sparks {
    public mesh: THREE.Points;
    readonly velocity: number = 10;
    public size: number;
    public currentTime: number = 0;
    readonly lifetime: number = 0.5;
    constructor(size = 40, assets) {
        this.size = size;
        this.mesh = this.create(assets);
    }

    create(assets) {
        const particleCount = 100,
            particles = new THREE.Geometry(),
            pMaterial = new THREE.PointsMaterial({
                color: 0xffffff,
                size: this.size,
                // map: assets.particle,
                blending: THREE.AdditiveBlending,
                transparent: true
            });

        // now create the individual particles
        for (var p = 0; p < particleCount; p++) {

            // create a particle with random
            // position values, -250 -> 250
            var pX = Math.random() * 50 - 25,
                pY = Math.random() * 50 - 25,
                pZ = Math.random() * 50 - 25,
                particle = //new THREE['Vertex'](
                    new THREE.Vector3(pX, pY, pZ)
            // );

            // add it to the geometry
            particles.vertices.push(particle);
        }

        const particleSystem = new THREE.Points(particles, pMaterial);
        // particleSystem.sortParticles = true;

        return particleSystem;
    }

    update(world, delta) {
        this.currentTime += delta;

        if (this.currentTime > this.lifetime) {
            if (this.mesh.parent) {
                world.scene.remove(this.mesh);
            }
            world.sparks = world.sparks.filter(s => s.mesh.id !== this.mesh.id);
        } else {
            let pCount = this.mesh.geometry['vertices'].length;

            while (pCount--) {
                const particle = this.mesh.geometry['vertices'][pCount];
                const direction = particle.clone().normalize();
                particle.add(direction.multiplyScalar(this.velocity));
            }
            // this.mesh.material['opacity'] -= 0.01;
            this.mesh.geometry['verticesNeedUpdate'] = true;
            // flag to the particle system
            // that we've changed its vertices.
            this.mesh.geometry['__dirtyVertices'] = true;
        }

    }
}