import OBJLoader  from './three/OBJLoader';
import MTLLoader from './three/MTLLoader';
import GLTFLoader from "./three/GLTFLoader";
import * as THREE from 'three';

export function getVolumeFromDistance(fromMesh: THREE.Mesh | THREE.Object3D, toMesh: THREE.Mesh | THREE.Object3D): number {
  const factor = 0.9998;
  const distanceToPlayer = toMesh.position.distanceTo(fromMesh.position);
  return (1 / (1 + (distanceToPlayer - distanceToPlayer * factor))) * 0.5;
}


export function LoadPlayerModel(shipType: string, cb: (mesh: THREE.Object3D)=> void, context) {

  var gltfLoader = new GLTFLoader();

  if(shipType === 'default') {
    gltfLoader['load']('models/ship.glb', (object) => {
      cb(object.scene.children[0]);
    }, undefined, (error) => {
      // object loading error
      console.log(error);
    });
  } else {
    throw new Error('There is no another type');
  }
}

// mtlLoader.load('models/ship.mtl', (mtlParseResult: THREE.Material) => {
//   objLoader.setMaterials(mtlParseResult);
//   objLoader['load']('models/ship.obj', (root: THREE.Object3D) => {
//     cb.call(context, root.children[0]);
//   });