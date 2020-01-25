import * as THREE from 'three'

export function createGun () {
   let cube = new THREE.CylinderGeometry(10,10,70,30);//BoxGeometry(12, 12, 100)
   let material = new THREE.MeshPhongMaterial({
     color: '#cccccc',
     wireframe: false,
     specular: 0xffffff,
     shininess: 20
   })
   let gun = new THREE.Mesh(cube, material)
 
   
 
   gun.position.set(0, 0, -50)
   gun.rotation.set(Math.PI / 2,0,0);
 
   let gunDetails = new THREE.Mesh(new THREE.CylinderGeometry(7,7,70,30), material)
   gunDetails.position.set(0, -10, 0)
   // gunDetails.rotation.set(1.5,0,0);
 
   gun.add(gunDetails);
   return gun
 }

export function createBoxGeometry(x,y,z, color) {
   var geometry = new THREE.BoxGeometry( 140, 10, 10 );
   var material = new THREE.MeshPhongMaterial( {color: color || 0xffffff} );
   var cube = new THREE.Mesh( geometry, material );
   cube.position.set(x,y,z);
   cube.rotation.set(0, 0, Math.PI/2);

   return cube;
}

export function createUserMesh (color, main?) {

   let userMesh = new THREE.Mesh(
     new THREE.SphereGeometry(70, 20, 20),
     new THREE.MeshPhongMaterial({
       // map: texture,
       // bumpMap: textureBump,
       color: color ? color : 0xffff00,
       // specular: 0x0022ff,
       shininess: 1,
       // side: THREE.BackSide,
       opacity: main ? 0: 1,
       transparent: main ? true : false
     })
   )
 
   userMesh.castShadow = true; //default is false
   userMesh.receiveShadow = true; //default
 
   userMesh.add(createGun());
   if(!main) userMesh.add(createBoxGeometry(73,0,0, color));
   if(!main) userMesh.add(createBoxGeometry(-73,0,0, color));
   
   return userMesh
 }

 export function createAim(x,y,z) {
  var geometry = new THREE.TorusGeometry( 0.5, 0.02, 10, 50 );
  var material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
  var torus = new THREE.Mesh( geometry, material );
  torus.position.set(x,y -0.2,z);
  return torus;
 }