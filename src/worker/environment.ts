import * as THREE from 'three'
import GLTFLoader from "./three/GLTFLoader";

export function addAsteroids (asteroids, cb) {
    var gltfLoader = new GLTFLoader();

    gltfLoader['load']('models/simple-asteroid.glb', (object) => {

        let material = new THREE.MeshStandardMaterial({
            color: 0x999999, roughness: 0.8, metalness: 0.2
        });

        let geometry = object.scene.children[0].geometry;

        asteroids.forEach(c => {
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
    let s = 250
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

 export function addSky (cb) {
  let loader = new THREE.ImageBitmapLoader()
  // create the geometry sphere
  let geometry = new THREE.SphereGeometry(250000, 20, 20)
  loader.load('./images/galaxy_starfield.png', function (imageBitmap: any) {
    var texture = new THREE.CanvasTexture(imageBitmap)
    texture.repeat.set(10, 10)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    var material = new THREE.MeshBasicMaterial({ map: texture })
    material.side = THREE.BackSide

    let sky = new THREE.Mesh(geometry, material)

   
    cb(sky);
  })

}