export function getVolumeFromDistance(fromMesh, toMesh) {
   const factor = 0.9998;
   const distanceToPlayer = toMesh.position.distanceTo(fromMesh.position);
   return  (1/(1 + (distanceToPlayer - distanceToPlayer * factor)) ) * 0.5;
 }