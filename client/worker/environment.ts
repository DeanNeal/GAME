import * as THREE from 'three'
import GLTFLoader from "./three/GLTFLoader";
import { Vector3 } from 'three';

export function addAsteroids(asteroids: any[], cb) {
    var gltfLoader = new GLTFLoader();

    gltfLoader['load']('models/simple-asteroid.glb', (object) => {

        let material = new THREE.MeshStandardMaterial({
            color: 0x999999, roughness: 0.8, metalness: 0.2
        });

        let geometry = object.scene.children[0].geometry;

        asteroids.forEach((c) => {
            let mesh = new THREE.Mesh(geometry, material);

            mesh.scale.set(c.size, c.size, c.size);
            mesh.userData = c;
            mesh.position.x = c.position.x;
            mesh.position.y = c.position.y;
            mesh.position.z = c.position.z;

            mesh.rotation.x = c.position.x;
            mesh.rotation.y = c.position.y;
            mesh.rotation.z = c.position.z;

            cb(mesh);
        });
    }, undefined, (error) => {
        // object loading error
        console.log(error);
    });
}

export function addRunes(runes, cb) {
    let s = 100
    let cube = new THREE.OctahedronGeometry(s)

    runes.forEach(c => {
        let material = new THREE.MeshNormalMaterial({
            // color: c.color,
            // wireframe: true,
            // /*opacity: 0.5, transparent: true ,*/ specular: 0xffffff,
            // shininess: 20
        })

        let mesh = new THREE.Mesh(cube, material)


        mesh.castShadow = true; //default is false
        mesh.receiveShadow = true; //default

        mesh.userData = c
        mesh.position.x = c.position.x
        mesh.position.y = c.position.y
        mesh.position.z = c.position.z

        mesh.rotation.x = c.position.x
        mesh.rotation.y = c.position.y
        mesh.rotation.z = c.position.z

        cb(mesh);

    })

}

export function addSky(): THREE.Group {
    const array = new Array(3000).fill('');

    const material = new THREE.MeshPhongMaterial({
        color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1
    });

    const geometry = new THREE.OctahedronGeometry(100);
    const group = new THREE.Group();

    array.forEach(() => {
        let mesh = new THREE.Mesh(geometry, material);

        const angle = new THREE.Vector3(
            Math.PI * (Math.random() > 0.5 ? Math.random() : -Math.random()),
            Math.PI * (Math.random() > 0.5 ? Math.random() : -Math.random()),
            Math.PI * (Math.random() > 0.5 ? Math.random() : -Math.random())
        ).normalize();

        const scale = 7 * Math.random();
        mesh.scale.set(scale, scale, scale);

        mesh.position.add(angle.multiplyScalar(700000));
        group.add(mesh);
    });

    return group;
}