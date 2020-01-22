import insideWorker from './vendor/inside-worker'

import FlyControls from './FlyControls'
// import ShipControls from './shipControls';
import { loadStarship } from './utils'
import SocketService from './socket.service'
import Helpers from './helper'
import * as THREE from 'three'

let container
let renderer
const startPosition = { x: 0, y: 40, z: 0 }
const clock = new THREE.Clock()
const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(45, 1920 / 1080, 1, 300000)

let allCubes = []
let allAsteroids = []
let bullets = []
let othersBullets = []
let InvisiblePlayer
let currentUser
let players = []
let controls
let lastCollisionId
let lastBulletCollisionId
let start = new Date().getTime()
const duration = 120
let isShooting = false

SocketService.socket.on('userIsReady', user => {
  players.push({ mesh: null, user: user })
  currentUser = user
})

SocketService.socket.on('updateCubes', cubes => {
  addCubes(cubes)
})

SocketService.socket.on('updateAsteroids', asteroids => {
  addAsteroids(asteroids)
})

SocketService.socket.on('updateUsersCoords', users => {
  users.forEach((user, i) => {
    players.forEach(p => {
      if (p.mesh && p.user.id === user.id) {
        //console.log(user.position);
        p.mesh.position.set(user.position.x, user.position.y, user.position.z)
        p.mesh.rotation.set(
          user.rotation._x,
          user.rotation._y,
          user.rotation._z
        )
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
  // console.log(this.players);
  let userMesh = players.filter(r => r.user.id == params.userId)[0].mesh
  let pos = userMesh.position.clone()
  let bulletMesh = createBullet()

  bulletMesh.position.set(pos.x, pos.y, pos.z)
  bulletMesh.rotation.set(
    params.rotation._x,
    params.rotation._y,
    params.rotation._z
  )

  othersBullets.push({
    mesh: bulletMesh,
    matrixWorld: params.matrixWorld,
    camPos: params.camPos
  })

  setTimeout(() => {
    scene.remove(bulletMesh)
    othersBullets.splice(0, 1)
  }, 3000)
})

SocketService.socket.on('deletePlayer', userId => {
  console.log('deletePlayer')

  for (let i = 0; i < players.length; i++) {
    if (players[i].user.id === userId) {
      scene.remove(players[i].mesh)
      players.splice(i, 1)
      return
    }
  }
})

SocketService.socket.on('cubeWasRemoved', cube => {
  for (let i = 0; i < allCubes.length; i++) {
    if (allCubes[i].userData.id === cube.id) {
      scene.remove(allCubes[i])
      allCubes.splice(i, 1)

      // worker.post({ type: 'updateCubes', cubes: allCubes })

      if (allCubes.length === 0) {
        SocketService.socket.emit('startAgain')
        worker.post({ type: 'startTimer' })
      }
      return
    }
  }
})

function addSky () {
  let loader = new THREE.ImageBitmapLoader()
  // create the geometry sphere
  let geometry = new THREE.SphereGeometry(250000, 100, 100)
  loader.load('./img/galaxy_starfield.png', function (imageBitmap) {
    var texture = new THREE.CanvasTexture(imageBitmap)
    texture.repeat.set(10, 10)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    var material = new THREE.MeshBasicMaterial({ map: texture })
    material.side = THREE.BackSide

    let galaxy = new THREE.Mesh(geometry, material)

    scene.add(galaxy)
  })

  // // create the material, using a texture of startfield
  // let material = new THREE.MeshBasicMaterial({ map: skyTexture })
  // // material.map = THREE.ImageBitmapLoader('img/sky.jpg')

  // material.side = THREE.BackSide
  // // create the mesh based on geometry and material
  // let galaxy = new THREE.Mesh(geometry, material)
  // scene.add(galaxy)
}

function addCubes (cubes) {
  let s = 150
  let cube = new THREE.BoxGeometry(s, s, s)

  // let loader = new THREE.ImageBitmapLoader();
  // let texture = loader.load('img/cyber2.jpg', function(texture) {
  //     texture.repeat.set(1, 1);
  //     texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  //     // texture.anisotropy = 16;
  //     // texture.needsUpdate = true;
  // });

  cubes.forEach(c => {
    let material = new THREE.MeshPhongMaterial({
      color: c.color,
      wireframe: true,
      /*opacity: 0.5, transparent: true ,*/ specular: 0xffffff,
      shininess: 50
    })
    let mesh = new THREE.Mesh(cube, material)

    mesh.userData = c
    mesh.position.x = c.position.x
    mesh.position.y = c.position.y
    mesh.position.z = c.position.z

    mesh.rotation.x = c.position.x
    mesh.rotation.y = c.position.y
    mesh.rotation.z = c.position.z

    // var spritey = Helpers.makeTextSprite(c.id, { fontsize: 50, fontface: "Georgia" });
    // spritey.position.set(50, 100, 0);

    // mesh.add(spritey);

    // mesh.matrixAutoUpdate = false;
    // mesh.updateMatrix();

    scene.add(mesh)
    allCubes.push(mesh)
  })

  // worker.post({type: 'updateCubes', cubes: allCubes})
}

function addAsteroids (asteroids) {
  let s = 1000
  let cube = new THREE.BoxGeometry(s, s, s)

  asteroids.forEach(c => {
    let material = new THREE.MeshPhongMaterial({
      color: c.color,
      wireframe: false,
      /*opacity: 0.5, transparent: true ,*/ specular: 0xffffff,
      shininess: 50
    })
    let mesh = new THREE.Mesh(cube, material)

    mesh.userData = c
    mesh.position.x = c.position.x
    mesh.position.y = c.position.y
    mesh.position.z = c.position.z

    mesh.rotation.x = c.position.x
    mesh.rotation.y = c.position.y
    mesh.rotation.z = c.position.z

    scene.add(mesh)
    allAsteroids.push(mesh)
  })
}

function addInvisiblePlayer () {
  InvisiblePlayer = createUserMesh()

  // loadStarship(object => {
  // this.scene.add(object);
      // InvisiblePlayer = object
      
      controls = new FlyControls(InvisiblePlayer, camera, container)
      // controls.enablePan = false;

      controls.movementSpeed = 1000;
      controls.domElement = container
      controls.rollSpeed = Math.PI / 3.5
      controls.autoForward = false
      controls.dragToLook = true

      // InvisiblePlayer.material.color.set(0xffffff)
      InvisiblePlayer.add(camera)
      InvisiblePlayer.position.set(0, 0, 0)
      InvisiblePlayer.rotation.set(0, 0, 0)

      let loader = new THREE.ImageBitmapLoader()

      loader.load('./img/aim.png', function (imageBitmap) {
        var texture = new THREE.CanvasTexture(imageBitmap)
        var spriteMaterial = new THREE.SpriteMaterial({
          map: texture,
          color: 0xffffff
        })
        var sprite = new THREE.Sprite(spriteMaterial)
        sprite.position.set(0, -0.11, -10)
        sprite.scale.set(0.5, 0.5, 0.5)

        camera.add(sprite)
      })

      scene.add(InvisiblePlayer)

      worker.post({type: 'readyForListeners'});
  // });
}

function createUserMesh () {
  // let loader = new THREE.ImageBitmapLoader();
  // let texture = loader.load('public/img/sphere.png', function(imageBitmap ) {
  //   var texture = new THREE.CanvasTexture( imageBitmap );
  //   var material = new THREE.MeshBasicMaterial( { map: texture } );
  //     // texture.repeat.set(10, 10);
  //     // texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  //     // texture.anisotropy = 16;
  //     // // texture.needsUpdate = true;
  //     // texture.minFilter = THREE.LinearFilter;
  // });
  // let textureBump = loader.load('public/img/bump.png', function(texture) {
  //     textureBump.repeat.set(10, 10);
  //     textureBump.wrapS = textureBump.wrapT = THREE.RepeatWrapping;
  //     textureBump.anisotropy = 16;
  //     // textureBump.needsUpdate = true;
  //     // texture.minFilter = THREE.LinearFilter;
  // });

  let userMesh = new THREE.Mesh(
    new THREE.SphereGeometry(70, 15, 15),
    new THREE.MeshPhongMaterial({
      // map: texture,
      // bumpMap: textureBump,
      color: 0xffff00,
      // specular: 0x0022ff,
      shininess: 1
      // side: THREE.BackSide,
      // opacity: 1,
      // transparent: true
    })
  )

  userMesh.add(createGun());

  return userMesh
}

function createGun () {
  let cube = new THREE.BoxGeometry(25, 25, 100)
  let material = new THREE.MeshPhongMaterial({
    color: 0x333333,
    wireframe: false,
    specular: 0xffffff,
    shininess: 50
  })
  let gun = new THREE.Mesh(cube, material)

  gun.position.set(0, 0, -50)
  return gun
}

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

//   // earthPlane.lookAt(earthPlane.worldToLocal(InvisiblePlayer.matrixWorld.getPosition()));

//   // this.Earth = createPlanet({size: 10000});
//   // this.Earth.position.x = 20000;
//   // this.Earth.position.z = 20000;
//   // this.Earth.position.y = 20000;
//   // this.scene.add(this.Earth);
// }

function createNewPlayer (user) {
  // loadStarship((object) => {
  let newPlayer = createUserMesh()
  newPlayer.userData = {
    id: user.id
  }
  newPlayer.position.set(0, 0, 0)

  newPlayer.material.color.set(0xffffff)

  // let spritey = Helpers.makeTextSprite(user.playerName, { fontsize: 32, fontface: "Georgia" });
  // spritey.position.set(50, 100, 0);
  // newPlayer.add(spritey);

  players.push({ mesh: newPlayer, user: user })

  scene.add(newPlayer)
  // });
  // let newPlayer = this.createUserMesh();
  // newPlayer.userData = {
  //     id: user.id
  // };
  // newPlayer.position.set(0, 0, 0);

  // let spritey = Helpers.makeTextSprite(user.playerName, { fontsize: 32, fontface: "Georgia" });
  // spritey.position.set(50, 100, 0);
  // newPlayer.add(spritey);

  // this.players.push({ mesh: newPlayer, user: user });

  // this.scene.add(newPlayer);
}

function cubesCollisionDetection () {
  let originPoint = InvisiblePlayer.position.clone()

  for (
    let vertexIndex = 0;
    vertexIndex < InvisiblePlayer.geometry.vertices.length;
    vertexIndex++
  ) {
    let localVertex = InvisiblePlayer.geometry.vertices[vertexIndex].clone()
    let globalVertex = localVertex.applyMatrix4(InvisiblePlayer.matrix)
    let directionVector = globalVertex.sub(InvisiblePlayer.position)
    let ray = new THREE.Raycaster(
      originPoint,
      directionVector.clone().normalize()
    )
    let collisionResults = ray.intersectObjects(allCubes)
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
        SocketService.socket.emit('increaseScores')
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
            SocketService.socket.emit('demage', player.user)
            // this.scene.remove(obj);
            obj.material.opacity = 0
            obj.material.transparent = true
          }
        }
      }
    })
}

function createBullet () {
  let bullet = new THREE.Mesh(
    new THREE.CubeGeometry(5, 5, 2000),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  )
  scene.add(bullet)
  return bullet
}

function shot () {
  if (currentUser) {
    let bullet = createBullet()

    worker.post({ type: 'playShot' })

    let pos = InvisiblePlayer.position.clone()
    let rot = InvisiblePlayer.rotation.clone()
    bullet.position.set(pos.x, pos.y, pos.z)
    bullet.rotation.set(rot.x, rot.y, rot.z)

    bullets.push({
      mesh: bullet,
      matrixWorld: InvisiblePlayer.matrixWorld.clone(),
      camPos: InvisiblePlayer.position.clone()
    })

    SocketService.socket.emit('fire', {
      userId: currentUser.id,
      matrixWorld: InvisiblePlayer.matrixWorld.clone(),
      camPos: InvisiblePlayer.position.clone(),
      rotation: rot
    })

    setTimeout(() => {
      scene.remove(bullet)
      bullets.splice(0, 1)
    }, 3000)
  }
}

function shotAnimate () {
  // let cl = clock.getElapsedTime();

  var elapsed = new Date().getTime() - start
  // console.log(elapsed);
  if (elapsed > duration) {
    if (isShooting) {
      shot(isShooting)
    }
    start = new Date().getTime()
  }
}

function render () {
  let delta = clock.getDelta()
  if (controls) {
    const speed = controls.update(delta)
    worker.post({type: 'speed', speed})
  }

  // controls.updateShip(delta);
  renderer.render(scene, camera)
}

function animate () {
  requestAnimationFrame(animate)

  for (let i = 0; i < allCubes.length; i++) {
    // allCubes[i].position.x += 1;
    allCubes[i].rotation.y += 0.01
    // allCubes[i].rotation.z += 0.2;
  }

  for (let i = 0; i < bullets.length; i++) {
    //Pick a point in front of the camera in camera space:
    var pLocal = new THREE.Vector3(0, 0, -1)
    // //Now transform that point into world space:
    var pWorld = pLocal.applyMatrix4(bullets[i].matrixWorld)
    // //You can now construct the desired direction vector:
    var dir = pWorld.sub(bullets[i].camPos).normalize()
    bullets[i].mesh.position.add(dir.multiplyScalar(1000))
  }

  for (let i = 0; i < othersBullets.length; i++) {
    var pLocal = new THREE.Vector3(0, 0, -1)
    var pWorld = pLocal.applyMatrix4(othersBullets[i].matrixWorld)
    var dir = pWorld.sub(othersBullets[i].camPos).normalize()
    othersBullets[i].mesh.position.add(dir.multiplyScalar(1000))
  }

  if (InvisiblePlayer) {
    SocketService.socket.emit('move', {
      position: InvisiblePlayer.position,
      rotation: InvisiblePlayer.rotation
    })

    // $('#position').html('Position: ' + this.InvisiblePlayer.position.x.toFixed(0) + ' ' + this.InvisiblePlayer.position.y.toFixed(0) + ' ' + this.InvisiblePlayer.position.z.toFixed(0));
    // $('#rotation').html('Rotation: ' + this.InvisiblePlayer.rotation.x.toFixed(2) + ' ' + this.InvisiblePlayer.rotation.y.toFixed(2) + ' ' + this.InvisiblePlayer.rotation.z.toFixed(2));
  }

  if (allCubes.length && InvisiblePlayer) {
    cubesCollisionDetection()
  }

  if (bullets.length) {
    damageCollisionDetection()
  }

  render()
  shotAnimate()
}

const worker = insideWorker(e => {
  const canvas = e.data.canvas
  if (canvas) {
    if (!canvas.style) canvas.style = { width: 0, height: 0 }

    container = canvas
    camera.position.set(startPosition.x, startPosition.y, startPosition.z)

    // lights
    let dLight = new THREE.DirectionalLight(0xffffff)
    dLight.position.set(2000, 2000, -6000)
    dLight.castShadow = true
    dLight.shadowCameraVisible = true
    dLight.shadowDarkness = 0.2
    dLight.shadowMapWidth = dLight.shadowMapHeight = 1000
    dLight.intensity = 1
    scene.add(dLight)

    let ambient = new THREE.AmbientLight(0x000000)
    ambient.color.setHSL(0.01, 0.01, 0.4)
    scene.add(ambient)

    // Helpers.addLight(scene, 0.55, 0.9, 0.5, 2000, 10000, -125000);

    // raycaster = new THREE.Raycaster()

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setClearColor(0x000000, 1)
    renderer.setPixelRatio(1)

    addInvisiblePlayer()

    addSky()

    animate()
  }

  if (e.data.type === 'resize') {
    renderer.setSize(e.data.width, e.data.height)

    camera.aspect = e.data.width / e.data.height
    camera.updateProjectionMatrix()
  }

  if (e.data.type === 'connection') {
    SocketService.socket.emit('add new player', e.data.playerOptions)
  }

  if (e.data.type === 'startFire') {
    isShooting = true
  }

  if (e.data.type === 'stopFire') {
    isShooting = false
  }

  if(e.data.type === 'mousedown') {
    controls.mousedown(e.data.mouse);
  }

  if(e.data.type === 'mousemove') {
    controls.mousemove(e.data.mouse);
  }

  if(e.data.type === 'mouseup') {
    controls.mouseup(e.data.mouse);
  }

  if(e.data.type === 'keydown') {
    controls.keydown(e.data.mouse);
  }

  if(e.data.type === 'keyup') {
    controls.keyup(e.data.mouse);
  }

  if(e.data.type === 'keypress') {
    controls.keypress(e.data.mouse);
  }
})
