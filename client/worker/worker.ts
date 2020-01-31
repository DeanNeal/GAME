import insideWorker from './inside-worker'

import FlyControls from './FlyControls'
import OrbitControls from './OrbitControls';

import SocketService from '../services/socket.service'

import * as THREE from 'three'
import { createBullet } from './objects'
import { addAsteroids, addRunes, addSky, addSun, addEarth } from './environment'
import { asteroidWithBulletCollision, runesCollisionDetection, bulletsWithEnemyCollisionDetection } from './collision'
import { getVolumeFromDistance, LoadPlayerModel, getPerformanceOfFunction } from './utils'
import { Player, Bullet } from './models';
import { Preloader } from './preloader';

type ViewMode = 0 | 1;

class Game {
    public assets = {};
    public canvas: HTMLCanvasElement
    public renderer: THREE.Renderer
    public clock: THREE.Clock = new THREE.Clock()
    public scene: THREE.Scene = new THREE.Scene()

    public camera1: THREE.Camera = new THREE.PerspectiveCamera(45, 1920 / 1080, 300, 6000000)
    public camera2: THREE.Camera = new THREE.PerspectiveCamera(45, 1920 / 1080, 300, 6000000)

    public fakeCamera: THREE.Camera;

    public allRunes: THREE.Mesh[] = []
    public allAsteroids: THREE.Mesh[] = []
    public bullets: Bullet[] = []

    public players: Player[] = []
    public controls
    public viewMode: ViewMode = 0;
    public player: Player;

    public earth: THREE.Mesh;
    public clouds: THREE.Mesh;

    //shooting
    public startTimeShooting: number = new Date().getTime();
    readonly durationBetweenShots: number = 200;
    public isShooting: boolean = false;

    //red zone
    public startTimeRedZone: number = new Date().getTime();
    public readonly durationBetweenZoneDamage: number = 1000;
    public readonly zoneRadius: number = 80000;


    public dLight;

    constructor() {
        this.animate = this.animate.bind(this);
    }

    start(canvas: HTMLCanvasElement, assets) {
        this.assets = assets;
        this.canvas = canvas;
        this.fakeCamera = this.camera2.clone();

        // // lights
        this.dLight = new THREE.DirectionalLight(0xffffff, 1)

        this.dLight.position.set(800000, 0, -50000);//.normalize();
        this.dLight.castShadow = false

        // this.dLight.shadow.mapSize.width = 8000;  // default
        // this.dLight.shadow.mapSize.height = 8000; // default
        // this.dLight.shadow.camera.near = 10;    // default
        // this.dLight.shadow.camera.far = 5000;     // default

        // this.dLight.shadowMapWidth = this.dLight.shadowMapHeight = 1000
        this.dLight.intensity = 2.5
        this.scene.add(this.dLight)


        // const light = new THREE.HemisphereLight(0xffffff, 0x000000, 0.05);
        // this.scene.add(light);

        let ambient = new THREE.AmbientLight(0x000000)
        ambient.color.setHSL(0.01, 0.01, 0.05)
        this.scene.add(ambient)

        // Helpers.addLight(scene, 0.55, 0.9, 0.5, 2000, 10000, 10000);

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
        // this.renderer.shadowMap.enabled = true;
        // this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;


        this.scene.add(addSky())

        addSun(this.dLight, this.assets)


        this.animate()
    }

    userCreated(user) {
        const { position, rotation, shipType } = user;
        this.player = new Player(user);

        worker.post({ type: 'userCreated', user })

        LoadPlayerModel(shipType, (mesh: THREE.Mesh) => {
            mesh.add(this.camera1)
            mesh.add(this.camera2)

            this.player.setMesh(mesh, position, rotation);

            this.initFirstPersonMode();

            const earth = addEarth(this.camera1.getWorldPosition(this.camera1.position), this.assets);

            this.earth = earth;
            this.scene.add(earth)

            this.scene.add(mesh)
        }, this);
    }

    addAsteroidsToScene(asteroids) {
        addAsteroids(asteroids, (mesh) => {
            this.scene.add(mesh)
            this.allAsteroids.push(mesh)
        });
    }

    addRunesToScene(runes) {
        addRunes(runes, (mesh: THREE.Mesh) => {
            this.scene.add(mesh)
            this.allRunes.push(mesh)
        });

        worker.post({ type: 'updateRunes', runes: this.allRunes.length })
    }

    runeWasRemoved(id) {
        for (let i = 0; i < this.allRunes.length; i++) {
            if (this.allRunes[i].userData.id === id) {
                this.scene.remove(this.allRunes[i])
                this.allRunes.splice(i, 1)

                worker.post({ type: 'updateRunes', runes: this.allRunes.length })
                return
            }
        }
    }

    asteroidWasRemoved(id: string) {
        const asteroid = this.allAsteroids.find(r => r.userData.id === id);
        this.scene.remove(asteroid);
        this.allAsteroids = this.allAsteroids.filter(r => r.userData.id !== id);
    }

    resetPosition(position, rotation) {
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
        let userMesh = this.players.find(r => r.params._id === params.userId).mesh
        let pos = userMesh.position.clone()
        let bullet = createBullet()
        const direction = new THREE.Vector3(params.direction.x, params.direction.y, params.direction.z);

        bullet.position.set(pos.x, pos.y, pos.z)
        bullet.rotation.set(
            params.rotation._x,
            params.rotation._y,
            params.rotation._z
        )

        //offset
        bullet.translateZ(-50);

        this.bullets.push(new Bullet(bullet, direction, false));

        this.scene.add(bullet);

        setTimeout(() => {
            if (bullet.parent) {
                this.scene.remove(bullet)
            }

            this.bullets = this.bullets.filter(b => b.mesh.id !== bullet.id);
        }, 5000)
    }

    deletePlayer(userId) {
        console.log('deletePlayer')

        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].params._id === userId) {
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

                this.scene.add(mesh)
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

        this.controls.minDistance = 550;
        this.controls.maxDistance = 500000;

        this.controls.zoomSpeed = 2;
        this.controls.rotateSpeed = 0.1;

        this.controls.maxPolarAngle = Math.PI;
    }



    shotAnimate() {
        if (this.isShooting) {
            const elapsed = new Date().getTime() - this.startTimeShooting
            if (elapsed > this.durationBetweenShots) {
                this.shot()
                this.startTimeShooting = new Date().getTime()
            }
        }
    }

    shot() {
        if (this.player.params) {
            let bullet = createBullet()

            let pos = this.player.mesh.position.clone()
            let rot = this.player.mesh.rotation.clone()

            bullet.position.set(pos.x, pos.y, pos.z)
            bullet.rotation.set(rot.x, rot.y, rot.z)

            const playerPos = this.player.mesh.position.clone();
            const matrixWorld = this.player.mesh.matrixWorld.clone();
            const direction = this.getDirectionOfBullet(matrixWorld, playerPos);

            bullet.translateZ(-50);

            this.bullets.push(new Bullet(bullet, direction, true))

            this.scene.add(bullet);

            SocketService.socket.emit('fire', {
                userId: this.player.params._id,
                direction: direction,
                rotation: rot,
                position: pos
            })

            setTimeout(() => {
                if (bullet.parent) {
                    this.scene.remove(bullet)
                }

                this.bullets = this.bullets.filter(b => b.mesh.id !== bullet.id);
            }, 5000)
        }
    }

    playSound(params) {
        console.log('SOUND: ' + params.sound, params);
        const pos = new THREE.Vector3(params.position.x, params.position.y, params.position.z);
        params.volume = getVolumeFromDistance(this.player.mesh.position, pos);
        worker.post({ type: 'playSound', params })
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

    getDirectionOfBullet(matrixWorld, camPos) {
        //Pick a point in front of the camera in camera space:
        const pLocal = new THREE.Vector3(0, 0, -1)
        // //Now transform that point into world space:
        const pWorld = pLocal.applyMatrix4(matrixWorld)
        // //You can now construct the desired direction vector:
        const dir = pWorld.sub(camPos).normalize()
        return dir;
    }

    animate() {
        requestAnimationFrame(this.animate)

        this.render()
        this.shotAnimate()

        // this.dLight.position.x += 100;

        for (let i = 0; i < this.allRunes.length; i++) {
            this.allRunes[i].rotation.y += 0.01
        }

        for (let i = 0; i < this.allAsteroids.length; i++) {
            this.allAsteroids[i].rotation.y += 0.001
            this.allAsteroids[i].rotation.z += 0.001
        }

        if (this.earth) {
            this.earth.rotation.y += 0.00006;
            this.earth.getObjectByName('clouds').rotation.z -= 0.00005;
        }

        for (let i = 0; i < this.bullets.length; i++) {
            const dir = this.bullets[i].direction.clone();
            this.bullets[i].mesh.position.add(dir.multiplyScalar(300))
        }

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
                id: this.player.params._id,
                position: this.player.mesh.position,
                rotation: this.player.mesh.rotation
            })
        }

        if (this.allRunes.length && this.player && this.player.mesh) {
            runesCollisionDetection(this.player, this.allRunes)
        }

        if (this.bullets.length) {
            bulletsWithEnemyCollisionDetection(this.scene, this.players, this.bullets.filter(r => r.collision), this.player)
        }

        if (this.allAsteroids.length && this.player && this.player.mesh) {
            // getPerformanceOfFunction(() => {
            asteroidWithBulletCollision(this.scene, this.allAsteroids, this.bullets.filter(r => r.collision), this.player);
            // });
        }

        if (this.player && this.player.mesh) {
            let { x, y, z } = this.player.mesh.position;

            if (Math.abs(x) > this.zoneRadius || Math.abs(y) > this.zoneRadius, Math.abs(z) > this.zoneRadius) {
                const elapsed = new Date().getTime() - this.startTimeRedZone
                if (elapsed > this.durationBetweenZoneDamage) {
                    // console.log('RED ZONE', x,y,z);
                    SocketService.socket.emit('outsideZone', this.player.params._id);
                    this.startTimeRedZone = new Date().getTime()
                }
            }
        }



    }

    onResize(e) {
        if (this.renderer) {
            this.renderer.setSize(e.data.width, e.data.height)

            this.camera1['aspect'] = e.data.width / e.data.height
            this.camera1['updateProjectionMatrix']()

            this.camera2['aspect'] = e.data.width / e.data.height
            this.camera2['updateProjectionMatrix']()

            this.fakeCamera['aspect'] = e.data.width / e.data.height
            this.fakeCamera['updateProjectionMatrix']()
        }

    }

}


const game = new Game();

const worker = insideWorker(e => {
    const canvas = e.data.canvas
    if (canvas) {
        if (!canvas.style) canvas.style = { width: 0, height: 0 }

        Preloader().then(assets => {
            game.start(canvas, assets);

            SocketService.socket.emit('addNewPlayer', e.data.opts)
            setTimeout(() => {
                worker.post({ type: 'preloader', enabled: false })
            }, 500)
        })

    }

    if (e.data.type === 'resize') {
        game.onResize(e);
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
        worker.post({ type: 'gotDamage', user })
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
    .on('dead', function ({ position, rotation }) {
        game.resetPosition(position, rotation)
    })
    .on('deletePlayer', userId => {
        game.deletePlayer(userId);
    })
    .on('runeWasRemoved', id => {
        game.runeWasRemoved(id);
    })
    .on('asteroidWasRemoved', id => {
        game.asteroidWasRemoved(id);
    })
    .on('playSound', (params) => {
        game.playSound(params);
    });