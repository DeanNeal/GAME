import * as THREE from 'three'

export function createBullet(): THREE.Mesh {
   const bullet = new THREE.Mesh(
      new THREE['CubeGeometry'](4, 4, 100),
      new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1 })
   )

   return bullet;
}