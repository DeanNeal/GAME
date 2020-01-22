import * as THREE from 'three'

export default function(options: any) {
  // EARTH
  var container = new THREE.Object3D();

  let earthGeometry = new THREE.SphereGeometry(options.size, 100, 100);
  let loader = new THREE.TextureLoader();
  let t1 = loader.load('public/img/earthmap1k.jpg', function(texture) {});
  let t2 = loader.load('public/img/earthbump1k.jpg', function(texture) {});
  let t3 = loader.load('public/img/earthspec1k.jpg', function(texture) {});

  let earthMaterial = new THREE.MeshPhongMaterial({
    map: t1,
    bumpMap: t2,
    bumpScale: 0.05,
    specularMap: t3, // shininess on oceans
    specular: 0x808080,
    // side: THREE.DoubleSide
  });

  // EARTH GLOW

  // var earthGlowMaterial = THREEx.createAtmosphereMaterial();
  // earthGlowMaterial.uniforms.glowColor.value.set(0x00b3ff);
  // earthGlowMaterial.uniforms.coeficient.value = 0.8;
  // earthGlowMaterial.uniforms.power.value = 2.0;
  // var earthGlow = new THREE.Mesh(earthGeometry, earthGlowMaterial);
  // earthGlow.scale.multiplyScalar(1.02);
  // earthGlow.position = earth.position;

  // container.add(earth);
  // container.add(earthGlow);



  let earth = new THREE.Mesh(earthGeometry, earthMaterial);
  // earth.receiveShadow = true;
  // earth.castShadow = true;

  // renderStack.push(function(now, delta) {
  //   earth.rotation.y += (1/8 * delta) / 1000;
  // });




  return container;
};

    // let drawSphere = function(x:any, z:any, material:any) {
    //     let cube = new THREE.Mesh(new THREE.SphereGeometry(70, 70, 20), material);
    //     cube.position.x = x;
    //     cube.position.y = 0;
    //     cube.position.z = z;
    //     cube.castShadow = cube.receiveShadow = true;
    //     this.scene.add(cube);
    //     this.allSpheres.push(cube);
    // }
