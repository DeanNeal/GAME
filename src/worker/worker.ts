import insideWorker from '../vendor/inside-worker'

import FlyControls from './FlyControls'
// import { loadStarship } from './utils'
import SocketService from './socket.service'
import Helpers from '../helper'
import * as THREE from 'three'
import { createUserMesh, createAim} from './objects'
import { addAsteroids, addRunes, addSky} from './environment'

let container
let renderer
const startPosition = { x: 0, y: 50, z: 50 }
const clock = new THREE.Clock()
const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(45, 1920 / 1080, 1, 800000)

let allRunes = []
let allAsteroids = []
let bullets = []
let othersBullets = []
let MainPlayer
let currentUser
let players = []
let controls
let lastCollisionId
let lastBulletCollisionId
let start = new Date().getTime()
const duration = 120
let isShooting = false


SocketService.socket.on('userUpdated', user => {
  players.push({ mesh: null, user: user })
  currentUser = user
  worker.post({ type: 'userUpdated', user })
  addMainPlayer(user)
  addSky((sky)=> {
    scene.add(sky)
  })
})

SocketService.socket.on('userList', users => {
  worker.post({ type: 'userList', users })
})

SocketService.socket.on('gotDamage', user => {
  worker.post({ type: 'userUpdated', user, damage: true })
})

SocketService.socket.on('updateRunes', runes => {
  addRunes(runes, (mesh)=> {
    scene.add(mesh)
    allRunes.push(mesh)
  });

  worker.post({ type: 'updateRunes', runes: allRunes.length })
})

SocketService.socket.on('updateAsteroids', asteroids => {
  addAsteroids(asteroids, (mesh)=> {
     scene.add(mesh)
     allAsteroids.push(mesh)
  });
})

SocketService.socket.on('updateUsersCoords', users => {
  users.forEach((user, i) => {
    players.forEach(p => {
      if (p.mesh && p.user.id === user.id) {
        p.mesh.position.set(user.position.x, user.position.y, user.position.z)
        p.mesh.rotation.set(
          user.rotation._x,
          user.rotation._y,
          user.rotation._z
        )
          
        p.userTextMesh.position.set(user.position.x + 100, user.position.y + 100, user.position.z + 100);
      }
    })
  })
})

SocketService.socket.on('otherNewPlayer', users => {
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

SocketService.socket.on('otherFire', params => {
  let userMesh = players.filter(r => r.user.id == params.userId)[0].mesh
  let pos = userMesh.position.clone()
  let bulletMesh = createBullet(params.color)

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


  worker.post({ type: 'playShot', volume: getVolumeFromDistance(MainPlayer, userMesh) })

  setTimeout(() => {
    scene.remove(bulletMesh)
    othersBullets.splice(0, 1)
  }, 5000)
})

SocketService.socket.on('killed', function ({position, rotation}) {
  MainPlayer.position.set(position.x, position.y, position.z)
  MainPlayer.rotation.set(rotation.x, rotation.y, rotation.z)
})

SocketService.socket.on('deletePlayer', userId => {
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

SocketService.socket.on('runeWasRemoved', rune => {
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

function getVolumeFromDistance(fromMesh, toMesh) {
  const factor = 0.9998;
  const distanceToPlayer = toMesh.position.distanceTo(fromMesh.position);
  return  (1/(1 + (distanceToPlayer - distanceToPlayer * factor)) ) * 0.5;
}


function addMainPlayer ({color, initPosition, initRotation}) {
  MainPlayer = createUserMesh(color, true)

  controls = new FlyControls(MainPlayer, camera, container)
  // controls.enablePan = false;

  controls.movementSpeed = 1000
  controls.domElement = container
  controls.rollSpeed = Math.PI / 3.5
  controls.autoForward = false
  controls.dragToLook = false

 
  MainPlayer.position.set(initPosition.x, initPosition.y, initPosition.z)
  MainPlayer.rotation.set(initRotation.x, initRotation.y, initRotation.z)
  MainPlayer.add(camera)

 
  camera.add(createAim(0, 0, -50))
  scene.add(MainPlayer)

  worker.post({ type: 'readyForListeners' })
}


function createNewPlayer (user) {
  let newPlayer = createUserMesh(user.color)
  newPlayer.userData = {
    id: user.id
  }

  var loader = new THREE.FontLoader()
  loader.load('./helvetiker_regular.typeface.json', function (font) {
    var textGeo = new THREE.TextGeometry(user.playerName, {
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

    players.push({ mesh: newPlayer, user: user, userTextMesh: userTextMesh })

    scene.add(newPlayer)
    scene.add(userTextMesh)
  })
}

function runesCollisionDetection () {
  let originPoint = MainPlayer.position.clone()

  for (
    let vertexIndex = 0;
    vertexIndex < MainPlayer.geometry.vertices.length;
    vertexIndex++
  ) {
    let localVertex = MainPlayer.geometry.vertices[vertexIndex].clone()
    let globalVertex = localVertex.applyMatrix4(MainPlayer.matrix)
    let directionVector = globalVertex.sub(MainPlayer.position)
    let ray = new THREE.Raycaster(
      originPoint,
      directionVector.clone().normalize()
    )
    let collisionResults = ray.intersectObjects(allRunes)
    if (
      collisionResults.length > 0 &&
      collisionResults[0].distance <= directionVector.length()
    ) {
      let obj = collisionResults[0].object
      if (obj.id !== lastCollisionId) {
        // console.log(obj.id);
        lastCollisionId = obj.id

        // obj.material.opacity = 0.4;
        // obj.material.transparent = true;
        // scene.remove(obj);

        SocketService.socket.emit('removeCube', obj.userData)
        // SocketService.socket.emit('increaseScores')
      }
    }
  }
}

function damageCollisionDetection () {
  players
    .filter(r => r.mesh)
    .forEach(player => {
      let plMesh = player.mesh
      let originPoint = plMesh.position.clone()

      for (
        let vertexIndex = 0;
        vertexIndex < plMesh.geometry.vertices.length;
        vertexIndex++
      ) {
        let localVertex = plMesh.geometry.vertices[vertexIndex].clone()
        let globalVertex = localVertex.applyMatrix4(plMesh.matrix)
        let directionVector = globalVertex.sub(plMesh.position)
        let ray = new THREE.Raycaster(
          originPoint,
          directionVector.clone().normalize()
        )

        let collisionResults = ray.intersectObjects(bullets.map(r => r.mesh))
        if (
          collisionResults.length > 0 &&
          collisionResults[0].distance <= directionVector.length()
        ) {
          let obj = collisionResults[0].object
          
          if (obj.id !== lastBulletCollisionId) {
            lastBulletCollisionId = obj.id
            
            SocketService.socket.emit('damage', player.user, currentUser)
            const volume = getVolumeFromDistance(MainPlayer, plMesh);
            worker.post({type: 'damageDone', volume: volume})
 
            obj.remove()
          }
        }
      }
    })
}

function createBullet (color) {
  let bullet = new THREE.Mesh(
    new THREE['CubeGeometry'](5, 5, 200),
    new THREE.MeshBasicMaterial({ color: color })
  )
  
  scene.add(bullet)
  return bullet
}

function shot () {
  if (currentUser) {
    let bullet = createBullet(currentUser.color)

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

    SocketService.socket.emit('fire', {
      userId: currentUser.id,
      matrixWorld: matrixWorld,
      camPos: camPos,
      rotation: rot,
      color: currentUser.color
    })

    worker.post({ type: 'playShot', volume: 0.1 })

    setTimeout(() => {
      scene.remove(bullet)
      bullets.splice(0, 1)
    }, 5000)
  }
}

function shotAnimate () {
  // let cl = clock.getElapsedTime();
  var elapsed = new Date().getTime() - start

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

  // controls.updateShip(delta);
  renderer.render(scene, camera)
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
    var pLocal = new THREE.Vector3(0, 0, -1)
    // //Now transform that point into world space:
    var pWorld = pLocal.applyMatrix4(bullets[i].matrixWorld)
    // //You can now construct the desired direction vector:
    var dir = pWorld.sub(bullets[i].camPos).normalize()

    bullets[i].mesh.position.add(dir.multiplyScalar(250))
  }

  for (let i = 0; i < othersBullets.length; i++) {
    var pLocal = new THREE.Vector3(0, 0, -1)
    var pWorld = pLocal.applyMatrix4(othersBullets[i].matrixWorld)
    var dir = pWorld.sub(othersBullets[i].camPos).normalize()
    othersBullets[i].mesh.position.add(dir.multiplyScalar(250))
  }


  players.forEach(user => {
    if (camera && user.userTextMesh) {
      // const factor = user.mesh.position.distanceTo(MainPlayer.position) / 300;
      var scaleVector = new THREE.Vector3();
      var scaleFactor = 2000;
      var sprite = user.userTextMesh;

      var scale = scaleVector.subVectors(user.mesh.position, MainPlayer.position).length() / scaleFactor;
      sprite.scale.set(scale, scale, scale); 
      sprite.position.set(70 + scale*6,70 + scale*6, 70 + scale*6);


      user.userTextMesh.lookAt(MainPlayer.position)
      user.userTextMesh.quaternion.copy( MainPlayer.quaternion );


    }
  })

  if (MainPlayer) {
    SocketService.socket.emit('move', {
      position: MainPlayer.position,
      rotation: MainPlayer.rotation
    })
  }

  if (allRunes.length && MainPlayer) {
    runesCollisionDetection()
  }

  if (bullets.length) {
    damageCollisionDetection()
  }



  // if(spotLight) {
  //   // spotLight.intensity += 0.001;
  //   spotLight.angle += 0.001;
  // }


}

let spotLight;
const worker = insideWorker(e => {
  const canvas = e.data.canvas
  if (canvas) {
    if (!canvas.style) canvas.style = { width: 0, height: 0 }

    container = canvas
    camera.position.set(startPosition.x, startPosition.y, startPosition.z)

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


    var light = new THREE.HemisphereLight( 0xffffff, 0x000000, 0.3 );
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

    camera.aspect = e.data.width / e.data.height
    camera.updateProjectionMatrix()
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

  // if(e.data.type === 'stopRotation') {
  //   controls.stopRotation();
  // }
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