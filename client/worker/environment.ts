import * as THREE from 'three'
import GLTFLoader from "./three/GLTFLoader";
import { Lensflare, LensflareElement } from './three/Lensflare';

import { Mesh } from 'three';
import { vertexShader, fragmentShader } from './shaders';
import { CustomImageLoader } from './loaders';

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
    const array = new Array(5000).fill('');

    const material = new THREE.MeshPhongMaterial({
        color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1
    });

    const geometry = new THREE.OctahedronGeometry(200);
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

        mesh.position.add(angle.multiplyScalar(2000000));
        group.add(mesh);
    });

    return group;
}

function addLensFlare(assets) {
    const lensflare = new Lensflare();

    const textureFlare0 = assets.lens1;
    const textureFlare1 = assets.lens2;
    const textureFlare2 = assets.lens3;

    lensflare.addElement(new LensflareElement(textureFlare0, 512, 0));
    lensflare.addElement(new LensflareElement(textureFlare1, 512, 0));
    lensflare.addElement(new LensflareElement(textureFlare2, 60, 0.6));

    return lensflare;
}

export function addSun(light, assets): void {
    light.add(addLensFlare(assets));
}

export function addEarth(player, assets) {
    const earthRadius = 500000;

    const geometry = new THREE.SphereGeometry(earthRadius, 50, 50);
    const textureMap = assets.earth;
    const textureBump = assets.earth_bump;
    const textureSpecular = assets.earth_specular;
    const textureClouds = assets.earth_clouds;

    const material: any = new THREE.MeshPhongMaterial({});

    material.map = textureMap
    material.bumpScale =  400
    material.bumpMap = textureBump
    material.specularMap = textureSpecular
    material.specular = new THREE.Color('#bbb')
    material.shininess = 14;

    const meshEarth = new THREE.Mesh(geometry, material);
    meshEarth.castShadow = false;
    meshEarth.receiveShadow = false;

    meshEarth.position.set(5000, -5000, -850000);
    meshEarth.scale.y = -1;

    var geometryClouds = new THREE.SphereGeometry(earthRadius + 3000, 32, 32)
    var materialClouds = new THREE.MeshPhongMaterial({
        map: textureClouds,
        side: THREE.FrontSide,
        opacity: 0.5,
        transparent: true,
        depthWrite: false,
    })
    var cloudMesh = new THREE.Mesh(geometryClouds, materialClouds)
    cloudMesh.name = 'clouds';
    meshEarth.add(cloudMesh);

    meshEarth.add(addAtosphere(geometry, player));

    return meshEarth;
}

function addAtosphere(geometry, position) {
    const customMaterial = new THREE.ShaderMaterial(
        {
            uniforms:
            {
                "c": { type: "f", value: 0.08 },
                "p": { type: "f", value: 2 },
                glowColor: { type: "c", value: new THREE.Color(0x0053d0) },
                viewVector: { type: "v3", value: position }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.FrontSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });

    const glowMesh = new THREE.Mesh(geometry.clone(), customMaterial.clone());
    glowMesh.scale.multiplyScalar(1.03);

    return glowMesh;
}