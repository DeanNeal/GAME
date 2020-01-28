import insideWorker from './inside-worker'

import FlyControls from './FlyControls'
import OrbitControls from './OrbitControls';

import SocketService from '../services/socket.service'

import * as THREE from 'three'
import { createBullet} from './objects'
import { addAsteroids, addRunes, addSky} from './environment'
import { asteroidCollision, runesCollisionDetection, damageCollisionDetection } from './collision'
import { getVolumeFromDistance, LoadPlayerModel } from './utils'

let container
let renderer
const clock = new THREE.Clock()
const scene = new THREE.Scene()

const camera1 = new THREE.PerspectiveCamera(45, 1920 / 1080, 1, 800000)
const camera2 = new THREE.PerspectiveCamera(45, 1920 / 1080, 1, 800000)

const fakeCamera = camera2.clone(); 


let allRunes = []
let allAsteroids = []
let bullets = []
let othersBullets = []
let MainPlayer
let currentUser
let players = []
let controls

let start = new Date().getTime()
const duration = 200
let isShooting = false

let viewMode = 0;


SocketService.socket
.on('userUpdated', user => {
  players.push({ mesh: null, user: user })
  currentUser = user
  worker.post({ type: 'userUpdated', user })
  addMainPlayer(user)
  addSky((sky)=> {
    scene.add(sky)
  })
})
.on('userList', users => {
  worker.post({ type: 'userList', users })
})
.on('gotDamage', user => {
  worker.post({ type: 'userUpdated', user, damage: true })
})
.on('updateRunes', runes => {
  addRunes(runes, (mesh)=> {
    scene.add(mesh)
    allRunes.push(mesh)
  });

  worker.post({ type: 'updateRunes', runes: allRunes.length })
})
.on('updateAsteroids', asteroids => {
  addAsteroids(asteroids, (mesh)=> {
     scene.add(mesh)
     allAsteroids.push(mesh)
  });
})
.on('updateUsersCoords', users => {
  users.forEach((user, i) => {
    players.forEach(p => {
      if (p.mesh && p.user.id === user.id) {
        p.mesh.position.set(user.position.x, user.position.y, user.position.z)
        p.mesh.rotation.set(
          user.rotation._x,
          user.rotation._y,
          user.rotation._z
        )

        let distance = p.mesh.position.distanceTo(MainPlayer.position) / 10;

        distance = distance > 1000 ? 1000 : distance; 
        distance = distance < 100 ? 100 : distance; 
  
        p.userTextMesh.position.set(user.position.x + distance, user.position.y + distance, user.position.z + distance);
      }
    })
  })
})
.on('otherNewPlayer', users => {
  users.forEach((user, i) => {
    let exists = players
      .map(x => {
        return x.user.id
      })
      .indexOf(user.id)

    if (exists === -1) {
      createNewPlayer(user)
    }
  })
})
.on('otherFire', params => {
  let userMesh = players.filter(r => r.user.id == params.userId)[0].mesh
  let pos = userMesh.position.clone()
  let bulletMesh = createBullet()

  bulletMesh.position.set(pos.x, pos.y, pos.z)
  bulletMesh.rotation.set(
    params.rotation._x,
    params.rotation._y,
    params.rotation._z
  )

  //offset
  bulletMesh.translateZ(-50);

  othersBullets.push({
    mesh: bulletMesh,
    matrixWorld: params.matrixWorld,
    camPos: params.camPos
  })

  scene.add(bulletMesh);

  worker.post({ type: 'playShot', volume: getVolumeFromDistance(MainPlayer, userMesh) })

  setTimeout(() => {
    scene.remove(bulletMesh)
    othersBullets.splice(0, 1)
  }, 5000)
})
.on('killed', function ({position, rotation}) {
  MainPlayer.position.set(position.x, position.y, position.z)
  MainPlayer.rotation.set(rotation.x, rotation.y, rotation.z)
})
.on('deletePlayer', userId => {
  console.log('deletePlayer')

  for (let i = 0; i < players.length; i++) {
    if (players[i].user.id === userId) {
      scene.remove(players[i].mesh)
      scene.remove(players[i].userTextMesh)
      players.splice(i, 1)
      return
    }
  }
})
.on('runeWasRemoved', rune => {
  for (let i = 0; i < allRunes.length; i++) {
    if (allRunes[i].userData.id === rune.id) {
      scene.remove(allRunes[i])
      allRunes.splice(i, 1)

      worker.post({ type: 'updateRunes', runes: allRunes.length })

      if (allRunes.length === 0) {
        worker.post({ type: 'startTimer' })
        SocketService.socket.emit('startAgain')
      }
      return
    }
  }
})
.on('asteroidWasRemoved', asteroid => {
  for (let i = 0; i < allAsteroids.length; i++) {
    if (allAsteroids[i].userData.id === asteroid.id) {
      scene.remove(allAsteroids[i])
      allAsteroids.splice(i, 1)
      return
    }
  }
})


function addMainPlayer ({shipType, position, rotation}) {
  // MainPlayer = createUserMesh(color, true)

  LoadPlayerModel(shipType, (data)=> {
    MainPlayer = data;

    // MainPlayer.castShadow = true;
    // MainPlayer.receiveShadow = true;
    
    MainPlayer.position.set(position.x, position.y, position.z)
    MainPlayer.rotation.set(rotation.x, rotation.y, rotation.z)

    MainPlayer.add(camera1)
    MainPlayer.add(camera2);

  
    initFirstPersonMode();
    
    scene.add(MainPlayer)
  });

}

function initFirstPersonMode() {
  controls = new FlyControls(MainPlayer, camera1, container)
  // controls.enablePan = false;

  controls.movementSpeed = 1000
  controls.domElement = container
  controls.rollSpeed = Math.PI / 3.5
  controls.autoForward = false
  controls.dragToLook = false
  camera1.up = new THREE.Vector3(0, 1, 0);

}

function initThirdPersonMode() {

  controls = new OrbitControls(MainPlayer, fakeCamera, container);
  // controls.enablePan = true;
  controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
  controls.dampingFactor = 0.25;

  controls.smoothZoom = true;

  controls.screenSpacePanning = false;

  controls.minDistance = 300;
  controls.maxDistance = 2500;

  controls.zoomSpeed = 2;
  controls.rotateSpeed = 0.1;

  controls.maxPolarAngle = Math.PI;
}


function createNewPlayer (user) {
  const {position, rotation, shipType} = user;

  LoadPlayerModel(shipType, (data)=> {
    let newPlayer = data//createUserMesh(user.color)
    newPlayer.userData = {
      id: user.id
    }
  
    newPlayer.position.set(position.x, position.y, position.z)
    newPlayer.rotation.set(rotation.x, rotation.y, rotation.z)
    
    const loader = new THREE.FontLoader()
    loader.load('./helvetiker_regular.typeface.json', function (font) {
  
      const textGeo = new THREE.TextGeometry(user.playerName, {
        font: font,
        size: 20,
        height: 1,
        bevelEnabled : false,
        bevelThickness : 1,
        bevelSize : 0.01,
        bevelSegments: 10,
      })
  
      let material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
      })
  
      const userTextMesh = new THREE.Mesh(textGeo, material)
  
      scene.add(newPlayer)
      scene.add(userTextMesh)
  
      //should be after
      players.push({ mesh: newPlayer, user: user, userTextMesh: userTextMesh, font: font})
    })
  });

}

function shot () {
  if (currentUser) {
    let bullet = createBullet()

    let pos = MainPlayer.position.clone()
    let rot = MainPlayer.rotation.clone()

    bullet.position.set(pos.x, pos.y, pos.z)
    bullet.rotation.set(rot.x, rot.y, rot.z)

    const camPos = MainPlayer.position.clone();
    const matrixWorld = MainPlayer.matrixWorld.clone();
    
    bullets.push({
      mesh: bullet,
      matrixWorld: matrixWorld,
      camPos: camPos
    })

    scene.add(bullet);

    SocketService.socket.emit('fire', {
      userId: currentUser.id,
      matrixWorld: matrixWorld,
      camPos: camPos,
      rotation: rot
      // color: currentUser.color
    })

    worker.post({ type: 'playShot', volume: 0.1 })

    setTimeout(() => {
      scene.remove(bullet)
      bullets.splice(0, 1);
    }, 5000)
  }
}

function shotAnimate () {
  // let cl = clock.getElapsedTime();
  const elapsed = new Date().getTime() - start

  if (elapsed > duration) {
    if (isShooting) {
      shot()
    }
    start = new Date().getTime()
  }
}

function render () {
  let delta = clock.getDelta()
  if (controls) {
    const speed = controls.update(delta)
    worker.post({ type: 'speed', speed })
  }


  camera2.copy(fakeCamera);

 
  renderer.render(scene, viewMode === 0 ? camera1 : camera2)
}

function animate () {
  requestAnimationFrame(animate)

  render()
  shotAnimate()


  for (let i = 0; i < allRunes.length; i++) {
    allRunes[i].rotation.y += 0.01
  }

  for (let i = 0; i < bullets.length; i++) {
    //Pick a point in front of the camera in camera space:
    const pLocal = new THREE.Vector3(0, 0, -1)
    // //Now transform that point into world space:
    const pWorld = pLocal.applyMatrix4(bullets[i].matrixWorld)
    // //You can now construct the desired direction vector:
    const dir = pWorld.sub(bullets[i].camPos).normalize()

    bullets[i].mesh.position.add(dir.multiplyScalar(250))
  }

  for (let i = 0; i < othersBullets.length; i++) {
    const pLocal = new THREE.Vector3(0, 0, -1)
    const pWorld = pLocal.applyMatrix4(othersBullets[i].matrixWorld)
    const dir = pWorld.sub(othersBullets[i].camPos).normalize()
    othersBullets[i].mesh.position.add(dir.multiplyScalar(250))
  }


  players.forEach(user => {
    if (user.userTextMesh) {
      const scaleVector = new THREE.Vector3();
      const scaleFactor = 2000;
      const sprite = user.userTextMesh;

      const scale = scaleVector.subVectors(user.mesh.position, MainPlayer.position).length() / scaleFactor;
      sprite.scale.set(scale, scale, scale); 
      sprite.position.set(70 + scale*6,70 + scale*6, 70 + scale*6);


      if(viewMode === 0) {
        user.userTextMesh.lookAt(MainPlayer.position)
        user.userTextMesh.quaternion.copy(MainPlayer.quaternion);
      } else {
        user.userTextMesh.lookAt(camera2.getWorldPosition(camera2.position))
        user.userTextMesh.quaternion.copy(camera2.getWorldQuaternion(camera2.quaternion));
      }

    }
  })

  if (MainPlayer) {
    SocketService.socket.emit('move', {
      position: MainPlayer.position,
      rotation: MainPlayer.rotation
    })
  }

  if (allRunes.length && MainPlayer) {
    runesCollisionDetection(MainPlayer, allRunes, worker)
  }

  if (bullets.length) {
    damageCollisionDetection(scene, players, bullets, currentUser, MainPlayer, worker)
  }

  if(allAsteroids.length && MainPlayer) {
    asteroidCollision(scene, allAsteroids, bullets, MainPlayer, worker);
  }
}


const worker = insideWorker(e => {
  const canvas = e.data.canvas
  if (canvas) {
    if (!canvas.style) canvas.style = { width: 0, height: 0 }

    container = canvas
    

    // // lights
    let dLight = new THREE.DirectionalLight(0xffffff, 1)
    dLight.position.set( 0.5, 1, 0 ).normalize();
    // dLight.castShadow = true

    // dLight.shadow.mapSize.width = 8000;  // default
    // dLight.shadow.mapSize.height = 8000; // default
    // dLight.shadow.camera.near = 10;    // default
    // dLight.shadow.camera.far = 5000;     // default

    // dLight.shadowMapWidth = dLight.shadowMapHeight = 1000
    dLight.intensity = 1
    scene.add(dLight)


    const light = new THREE.HemisphereLight( 0xffffff, 0x000000, 0.5 );
    scene.add( light );

    // let ambient = new THREE.AmbientLight(0x000000)
    // ambient.color.setHSL(0.01, 0.01, 0.5)
    // scene.add(ambient)

    // Helpers.addLight(scene, 0.55, 0.9, 0.5, 2000, 10000, 10000);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // renderer.setPixelRatio(1)

    animate()
  }

  if (e.data.type === 'resize') {
    renderer.setSize(e.data.width, e.data.height)

    camera1.aspect = e.data.width / e.data.height
    camera1.updateProjectionMatrix()

    camera2.aspect = e.data.width / e.data.height
    camera2.updateProjectionMatrix()

    fakeCamera.aspect = e.data.width / e.data.height
    fakeCamera.updateProjectionMatrix()
  }

  if (e.data.type === 'connection') {
    SocketService.socket.emit('addNewPlayer', e.data.playerOptions)
  }

  if (e.data.type === 'startFire') {
    isShooting = true
  }

  if (e.data.type === 'stopFire') {
    isShooting = false
  }

  if(!controls) return;

  if (e.data.type === 'mousedown') {
    controls.mousedown(e.data.mouse)
  }

  if (e.data.type === 'mousemove') {
    controls.mousemove(e.data.mouse)
  }

  if (e.data.type === 'mouseup') {
    controls.mouseup(e.data.mouse)
  }

  if (e.data.type === 'keydown') {
    controls.keydown(e.data.mouse)
  }

  if (e.data.type === 'keyup') {
    controls.keyup(e.data.mouse)
  }

  if (e.data.type === 'keypress') {
    controls.keypress(e.data.mouse)
  }

  if(e.data.type === 'mousewheel') {
    // if (e.data.delta < 0) {
    //   controls.zoomOut();
    // } else {
    //   controls.zoomIn();
    // }
    controls.mousewheel(e.data.mouse);
  }

  if(e.data.type === 'changeViewMode') {

    viewMode = viewMode === 0 ? 1 : 0;

    if(viewMode === 0) {
      initFirstPersonMode();
    } else {
      initThirdPersonMode();
    }


  }
})














// function addPlanet () {
//   var loader = new THREE.ImageBitmapLoader()
//   var earthTexture = loader.load('public/img/mars.jpg', function (texture) {
//     texture.wrapS = texture.wrapT = THREE.RepeatWrapping
//     texture.offset.set(0, 0)
//     texture.repeat.set(1, 1)
//   })

//   var earthMaterial = new THREE.MeshLambertMaterial({ map: earthTexture })
//   var earthPlane = new THREE.Mesh(
//     new THREE.PlaneGeometry(30000, 30000),
//     earthMaterial
//   )
//   earthPlane.material.side = THREE.DoubleSide
//   earthPlane.position.x = 70000
//   earthPlane.position.z = 70000
//   earthPlane.position.y = 70000

//   // rotation.z is rotation around the z-axis, measured in radians (rather than degrees)
//   // Math.PI = 180 degrees, Math.PI / 2 = 90 degrees, etc.
//   earthPlane.rotation.z = (0.1 * Math.PI) / 2
//   earthPlane.rotation.y = (0.5 * Math.PI) / 2

//   scene.add(earthPlane)

//   // earthPlane.lookAt(earthPlane.worldToLocal(MainPlayer.matrixWorld.getPosition()));

//   // this.Earth = createPlanet({size: 10000});
//   // this.Earth.position.x = 20000;
//   // this.Earth.position.z = 20000;
//   // this.Earth.position.y = 20000;
//   // this.scene.add(this.Earth);
// }