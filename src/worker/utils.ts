import OBJLoader  from './three/OBJLoader';
import MTLLoader from './three/MTLLoader';


export function getVolumeFromDistance(fromMesh, toMesh) {
  const factor = 0.9998;
  const distanceToPlayer = toMesh.position.distanceTo(fromMesh.position);
  return (1 / (1 + (distanceToPlayer - distanceToPlayer * factor))) * 0.5;
}


export function LoadPlayerModel(color, cb) {

  var objLoader = new OBJLoader();
  const mtlLoader = new MTLLoader();

  mtlLoader.load('models/ship.mtl', (mtlParseResult) => {
    objLoader.setMaterials(mtlParseResult);
    objLoader['load']('models/ship.obj', (root) => {
      cb(root.children[0]);
    });
  });
}