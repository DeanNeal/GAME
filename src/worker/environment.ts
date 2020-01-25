import * as THREE from 'three'

export function addAsteroids (asteroids, cb) {
   asteroids.forEach(c => {
     let cube = new THREE.BoxGeometry(c.size, c.size, c.size);
 
     let material = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.5, metalness: .5
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

 export function addRunes(runes, cb) {
    let s = 150
    let cube = new THREE.BoxGeometry(s, s, s)
  
    runes.forEach(c => {
      let material = new THREE.MeshPhongMaterial({
        color: c.color,
        wireframe: true,
        /*opacity: 0.5, transparent: true ,*/ specular: 0xffffff,
        shininess: 50
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