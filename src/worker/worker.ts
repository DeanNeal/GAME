import insideWorker from './inside-worker'

import FlyControls from './FlyControls'
import OrbitControls from './OrbitControls';

import SocketService from '../services/socket.service'

import * as THREE from 'three'
import { createBullet } from './objects'
import { addAsteroids, addRunes, addSky } from './environment'
import { asteroidCollision, runesCollisionDetection, damageCollisionDetection } from './collision'
import { getVolumeFromDistance, LoadPlayerModel } from './utils'



class Player {
  mesh: THREE.Object3D;
  params: any;
  userTextMesh: THREE.Mesh;
  constructor(params: any, userTextMesh?: THREE.Mesh) {
    this.params = params;
    // this.mesh.position.set(position.x, position.y, position.z)
    // this.mesh.rotation.set(rotation.x, rotation.y, rotation.z)

    this.userTextMesh = userTextMesh;
  }

  setMesh(mesh: THREE.Mesh | THREE.Object3D, position: THREE.Vector3, rotation: THREE.Euler) {
    this.mesh = mesh;
    this.mesh.position.set(position.x, position.y, position.z)
    this.mesh.rotation.set(rotation.x, rotation.y, rotation.z)
  }
}

class Game {
  canvas: HTMLCanvasElement;
  renderer
  clock = new THREE.Clock()
  scene = new THREE.Scene()

  camera1 = new THREE.PerspectiveCamera(45, 1920 / 1080, 1, 800000)
  camera2 = new THREE.PerspectiveCamera(45, 1920 / 1080, 1, 800000)

  fakeCamera;

  allRunes = []
  allAsteroids = []
  bullets = []
  // othersBullets = []

  players: Player[] = []
  controls
  viewMode: 0 | 1 = 0;
  player: Player;

  startTime = new Date().getTime();
  duration = 200;
  isShooting = false;


  constructor() {
    this.animate = this.animate.bind(this);
  }

  start(canvas) {
    this.canvas = canvas;
    this.fakeCamera = this.camera2.clone();

    // // lights
    let dLight = new THREE.DirectionalLight(0xffffff, 1)
    dLight.position.set(0.5, 1, 0).normalize();
    // dLight.castShadow = true

    // dLight.shadow.mapSize.width = 8000;  // default
    // dLight.shadow.mapSize.height = 8000; // default
    // dLight.shadow.camera.near = 10;    // default
    // dLight.shadow.camera.far = 5000;     // default

    // dLight.shadowMapWidth = dLight.shadowMapHeight = 1000
    dLight.intensity = 1
    this.scene.add(dLight)


    const light = new THREE.HemisphereLight(0xffffff, 0x000000, 0.5);
    this.scene.add(light);

    // let ambient = new THREE.AmbientLight(0x000000)
    // ambient.color.setHSL(0.01, 0.01, 0.5)
    // scene.add(ambient)

    // Helpers.addLight(scene, 0.55, 0.9, 0.5, 2000, 10000, 10000);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // renderer.setPixelRatio(1)

    this.animate()
  }

  userCreated(user) {
    const { position, rotation, shipType } = user;
    this.player = new Player(user);

    worker.post({ type: 'userCreated', user })

    LoadPlayerModel(shipType, (mesh) => {

      // MainPlayer.castShadow = true;
      // MainPlayer.receiveShadow = true;
      mesh.add(this.camera1)
      mesh.add(this.camera2);

      // this.players.push();//{ mesh: null, user: user })
      // currentUser = user


      this.player.setMesh(mesh, position, rotation);

      this.initFirstPersonMode();

      this.scene.add(mesh)
    }, this);

    addSky((sky) => {
      this.scene.add(sky)
    })
  }

  addAsteroidsToScene(asteroids) {
    addAsteroids(asteroids, (mesh) => {
      this.scene.add(mesh)
      this.allAsteroids.push(mesh)
    });
  }

  addRunesToScene(runes) {
    addRunes(runes, (mesh) => {
      this.scene.add(mesh)
      this.allRunes.push(mesh)
    });

    worker.post({ type: 'updateRunes', runes: this.allRunes.length })
  }

  runeWasRemoved(rune) {
    for (let i = 0; i < this.allRunes.length; i++) {
      if (this.allRunes[i].userData.id === rune.id) {
        this.scene.remove(this.allRunes[i])
        this.allRunes.splice(i, 1)

        worker.post({ type: 'updateRunes', runes: this.allRunes.length })

        if (this.allRunes.length === 0) {
          worker.post({ type: 'startTimer' })
          SocketService.socket.emit('startAgain')
        }
        return
      }
    }
  }

  asteroidWasRemoved(asteroid) {
    for (let i = 0; i < this.allAsteroids.length; i++) {
      if (this.allAsteroids[i].userData.id === asteroid.id) {
        this.scene.remove(this.allAsteroids[i])
        this.allAsteroids.splice(i, 1)
        return
      }
    }
  }

  killed(position, rotation) {
    this.player.mesh.position.set(position.x, position.y, position.z)
    this.player.mesh.rotation.set(rotation.x, rotation.y, rotation.z)
  }

  anotherNewPlayer(users) {
    users.forEach((user, i) => {
      let exists = this.players
        .map((x: Player) => {
          return x.params.id
        })
        .indexOf(user.id)

      if (exists === -1 && user.id !== this.player.params.id) {
        this.createNewPlayer(user)
      }
    })
  }

  otherFire(params) {
    let userMesh = this.players.filter(r => r.params.id == params.userId)[0].mesh
    let pos = userMesh.position.clone()
    let bullet = createBullet()

    bullet.position.set(pos.x, pos.y, pos.z)
    bullet.rotation.set(
      params.rotation._x,
      params.rotation._y,
      params.rotation._z
    )

    //offset
    bullet.translateZ(-50);

    this.bullets.push({
      mesh: bullet,
      matrixWorld: params.matrixWorld,
      camPos: params.camPos,
      notifyServer: false
    })

    this.scene.add(bullet);

    worker.post({ type: 'playShot', volume: getVolumeFromDistance(this.player.mesh, userMesh) })

    setTimeout(() => {
      if(bullet.parent) {
        this.scene.remove(bullet)
      }
      
      this.bullets = this.bullets.filter(b=> b.mesh.id !== bullet.id);
    }, 5000)
  }

  deletePlayer(userId) {
    console.log('deletePlayer')

    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].params.id === userId) {
        this.scene.remove(this.players[i].mesh)
        this.scene.remove(this.players[i].userTextMesh)
        this.players.splice(i, 1)
        return
      }
    }
  }

  createNewPlayer(user) {
    const { position, rotation, shipType } = user;

    LoadPlayerModel(shipType, (mesh) => {
      let newPlayer = mesh//createUserMesh(user.color)
      // newPlayer.userData = {
      //   id: user.id
      // }

      const loader = new THREE.FontLoader()
      loader.load('./helvetiker_regular.typeface.json', (font) => {

        const textGeo = new THREE.TextGeometry(user.playerName, {
          font: font,
          size: 20,
          height: 1,
          bevelEnabled: false,
          bevelThickness: 1,
          bevelSize: 0.01,
          bevelSegments: 10,
        })

        let material = new THREE.MeshPhongMaterial({
          color: 0xffffff,
          emissive: 0xffffff,
        })

        const userTextMesh = new THREE.Mesh(textGeo, material)

        this.scene.add(newPlayer)
        this.scene.add(userTextMesh)

        //should be after
        const enemy = new Player(user, userTextMesh);
        enemy.setMesh(mesh, position, rotation);
        this.players.push(enemy);//({ mesh: newPlayer, user: user, userTextMesh: userTextMesh, font: font})
      })
    }, this);

  }

  updateUsersCoords(users) {
    users.forEach((user, i) => {
      this.players.forEach(p => {
        if (p.mesh && p.params.id === user.id) {
          p.mesh.position.set(user.position.x, user.position.y, user.position.z)
          p.mesh.rotation.set(
            user.rotation._x,
            user.rotation._y,
            user.rotation._z
          )

          let distance = p.mesh.position.distanceTo(this.player.mesh.position) / 10;

          distance = distance > 1000 ? 1000 : distance;
          distance = distance < 100 ? 100 : distance;

          p.userTextMesh.position.set(user.position.x + distance, user.position.y + distance, user.position.z + distance);
        }
      })
    })
  }

  initFirstPersonMode() {
    this.controls = new FlyControls(this.player.mesh, this.camera1, this.canvas)
    // controls.enablePan = false;

    this.controls.movementSpeed = 1000
    this.controls.domElement = this.canvas;
    this.controls.rollSpeed = Math.PI / 3.5
    this.controls.autoForward = false
    this.controls.dragToLook = false
    this.camera1.up = new THREE.Vector3(0, 1, 0);

  }

  initThirdPersonMode() {

    this.controls = new OrbitControls(this.player.mesh, this.fakeCamera, this.canvas);
    // controls.enablePan = true;
    this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    this.controls.dampingFactor = 0.25;

    this.controls.smoothZoom = true;

    this.controls.screenSpacePanning = false;

    this.controls.minDistance = 300;
    this.controls.maxDistance = 2500;

    this.controls.zoomSpeed = 2;
    this.controls.rotateSpeed = 0.1;

    this.controls.maxPolarAngle = Math.PI;
  }



  shotAnimate() {
    // let cl = clock.getElapsedTime();
    const elapsed = new Date().getTime() - this.startTime

    if (elapsed > this.duration) {
      if (this.isShooting) {
        this.shot()
      }
      this.startTime = new Date().getTime()
    }
  }

  shot() {
    if (this.player.params) {
      let bullet = createBullet()

      let pos = this.player.mesh.position.clone()
      let rot = this.player.mesh.rotation.clone()

      bullet.position.set(pos.x, pos.y, pos.z)
      bullet.rotation.set(rot.x, rot.y, rot.z)

      const camPos = this.player.mesh.position.clone();
      const matrixWorld = this.player.mesh.matrixWorld.clone();

      this.bullets.push({
        mesh: bullet,
        matrixWorld: matrixWorld,
        camPos: camPos,
        notifyServer: true
      })

      this.scene.add(bullet);

      SocketService.socket.emit('fire', {
        userId: this.player.params.id,
        matrixWorld: matrixWorld,
        camPos: camPos,
        rotation: rot
      })

      worker.post({ type: 'playShot', volume: 0.1 })

      setTimeout(() => {
        if(bullet.parent) {
          this.scene.remove(bullet)
        }
        
        this.bullets = this.bullets.filter(b=> b.mesh.id !== bullet.id);
      }, 5000)
    }
  }


  render() {
    let delta = this.clock.getDelta()
    if (this.controls) {
      const speed = this.controls.update(delta)
      worker.post({ type: 'speed', speed })
    }

    this.camera2.copy(this.fakeCamera);

    this.renderer.render(this.scene, this.viewMode === 0 ? this.camera1 : this.camera2)
  }

  animate() {
    requestAnimationFrame(this.animate)

    this.render()
    this.shotAnimate()


    for (let i = 0; i < this.allRunes.length; i++) {
      this.allRunes[i].rotation.y += 0.01
    }

    for (let i = 0; i < this.bullets.length; i++) {
      //Pick a point in front of the camera in camera space:
      const pLocal = new THREE.Vector3(0, 0, -1)
      // //Now transform that point into world space:
      const pWorld = pLocal.applyMatrix4(this.bullets[i].matrixWorld)
      // //You can now construct the desired direction vector:
      const dir = pWorld.sub(this.bullets[i].camPos).normalize()

      this.bullets[i].mesh.position.add(dir.multiplyScalar(250))
    }

    // for (let i = 0; i < this.othersBullets.length; i++) {
    //   const pLocal = new THREE.Vector3(0, 0, -1)
    //   const pWorld = pLocal.applyMatrix4(this.othersBullets[i].matrixWorld)
    //   const dir = pWorld.sub(this.othersBullets[i].camPos).normalize()
    //   this.othersBullets[i].mesh.position.add(dir.multiplyScalar(250))
    // }


    this.players.forEach(user => {
      if (user.userTextMesh) {
        const scaleVector = new THREE.Vector3();
        const scaleFactor = 2000;
        const sprite = user.userTextMesh;

        const scale = scaleVector.subVectors(user.mesh.position, this.player.mesh.position).length() / scaleFactor;
        sprite.scale.set(scale, scale, scale);
        sprite.position.set(70 + scale * 6, 70 + scale * 6, 70 + scale * 6);


        if (this.viewMode === 0) {
          user.userTextMesh.lookAt(this.player.mesh.position)
          user.userTextMesh.quaternion.copy(this.player.mesh.quaternion);
        } else {
          user.userTextMesh.lookAt(this.camera2.getWorldPosition(this.camera2.position))
          user.userTextMesh.quaternion.copy(this.camera2.getWorldQuaternion(this.camera2.quaternion));
        }

      }
    })

    if (this.player && this.player.mesh) {
      SocketService.socket.emit('move', {
        position: this.player.mesh.position,
        rotation: this.player.mesh.rotation
      })
    }

    if (this.allRunes.length && this.player && this.player.mesh) {
      runesCollisionDetection(this.player, this.allRunes, worker)
    }

    if (this.bullets.length) {
      damageCollisionDetection(this.scene, this.players, this.bullets, this.player, worker)
    }

    if (this.allAsteroids.length && this.player && this.player.mesh) {
      asteroidCollision(this.scene, this.allAsteroids, this.bullets, this.player, worker);
    }
  }

  onResize(e) {
    this.renderer.setSize(e.data.width, e.data.height)

    this.camera1.aspect = e.data.width / e.data.height
    this.camera1.updateProjectionMatrix()

    this.camera2.aspect = e.data.width / e.data.height
    this.camera2.updateProjectionMatrix()

    this.fakeCamera.aspect = e.data.width / e.data.height
    this.fakeCamera.updateProjectionMatrix()
  }

}



const game = new Game();

const worker = insideWorker(e => {
  const canvas = e.data.canvas
  if (canvas) {
    if (!canvas.style) canvas.style = { width: 0, height: 0 }
    game.start(canvas);
  }

  if (e.data.type === 'resize') {
    game.onResize(e);
  }

  if (e.data.type === 'connection') {
    SocketService.socket.emit('addNewPlayer', e.data.playerOptions)
  }

  if (e.data.type === 'startFire') {
    game.isShooting = true
  }

  if (e.data.type === 'stopFire') {
    game.isShooting = false
  }

  if (!game.controls) return;

  if (e.data.type === 'mousedown') {
    game.controls.mousedown(e.data.mouse)
  }

  if (e.data.type === 'mousemove') {
    game.controls.mousemove(e.data.mouse)
  }

  if (e.data.type === 'mouseup') {
    game.controls.mouseup(e.data.mouse)
  }

  if (e.data.type === 'keydown') {
    game.controls.keydown(e.data.mouse)
  }

  if (e.data.type === 'keyup') {
    game.controls.keyup(e.data.mouse)
  }

  if (e.data.type === 'keypress') {
    game.controls.keypress(e.data.mouse)
  }

  if (e.data.type === 'mousewheel') {
    // if (e.data.delta < 0) {
    //   controls.zoomOut();
    // } else {
    //   controls.zoomIn();
    // }
    game.controls.mousewheel(e.data.mouse);
  }

  if (e.data.type === 'changeViewMode') {

    game.viewMode = game.viewMode === 0 ? 1 : 0;

    if (game.viewMode === 0) {
      game.initFirstPersonMode();
    } else {
      game.initThirdPersonMode();
    }


  }
})




SocketService.socket
  .on('userCreated', user => {
    game.userCreated(user);
  })
  .on('userList', users => {
    worker.post({ type: 'userList', users })
  })
  .on('gotDamage', user => {
    worker.post({ type: 'userUpdated', user, damage: true })
  })
  .on('updateRunes', runes => {
    game.addRunesToScene(runes);
  })
  .on('updateAsteroids', asteroids => {
    game.addAsteroidsToScene(asteroids);
  })
  .on('updateUsersCoords', users => {
    game.updateUsersCoords(users);
  })
  .on('anotherNewPlayer', users => {
    game.anotherNewPlayer(users);
  })
  .on('otherFire', params => {
    game.otherFire(params);
  })
  .on('killed', function ({ position, rotation }) {
    game.killed(position, rotation)
  })
  .on('deletePlayer', userId => {
    game.deletePlayer(userId);
  })
  .on('runeWasRemoved', rune => {
    game.runeWasRemoved(rune);
  })
  .on('asteroidWasRemoved', asteroid => {
    game.asteroidWasRemoved(asteroid);
  })
