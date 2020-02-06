import * as THREE from 'three';

// export function getVolumeFromDistance(fromMesh: THREE.Mesh | THREE.Object3D, toMesh: THREE.Mesh | THREE.Object3D): number {
//   const factor = 0.9998;
//   const distanceToPlayer = toMesh.position.distanceTo(fromMesh.position);
//   return (1 / (1 + (distanceToPlayer - distanceToPlayer * factor))) * 0.5;
// }

export function getVolumeFromDistance(from: THREE.Vector3, to: THREE.Vector3): number {
  const factor = 0.9998;
  const distanceToPlayer = from.distanceTo(to);
  return (1 / (1 + (distanceToPlayer - distanceToPlayer * factor))) * 0.5;
}

export function getPerformanceOfFunction(fn) {
  var t0 = performance.now();
  fn();
  var t1 = performance.now();
  console.log((t1 - t0))
}



export function randomDecemal(from: number, to: number): number {
  return parseFloat((Math.random() * (to - from) + from).toFixed(4))
}