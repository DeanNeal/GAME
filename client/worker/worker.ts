import insideWorker from './inside-worker'

import FlyControls from './controls/FlyControls'
import OrbitControls from './controls/OrbitControls';

import SocketService from '../services/socket.service'

import * as THREE from 'three'

import { EffectComposer } from './three/post-processing/EffectComposer';
import { RenderPass } from './three/post-processing/RenderPass'
// import { SSAOPass } from './three/post-processing/SSAOPass'
// import { SAOPass } from './three/post-processing/SAOPass';
// import { UnrealBloomPass } from './three/post-processing/UnrealBloomPass';
// import { ShaderPass } from './three/post-processing/ShaderPass';
// import { LuminosityShader } from './three/post-processing/LuminosityShader';
// import { SepiaShader } from './shaders';
// import { ShaderPass } from './three/post-processing/ShaderPass';
// import { FilmPass } from './three/post-processing/FilmPass';
import { BokehPass } from './three/post-processing/BokehPass';

import { addAsteroids, addAtosphere, addRunes, addSky, addSun, addEarth } from './environment'
import { asteroidWithBulletCollision, runesCollisionDetection, bulletsWithEnemyCollisionDetection } from './collision'
import { getVolumeFromDistance, getPerformanceOfFunction } from './utils'
import { Player } from './models';
import { Preloader } from './preloader';
import { attachGUI, scaleXLeft, scaleXRight } from './gui';
import { Bullet } from './entities/bullet';


type ViewMode = 0 | 1;

class Game {
    public assets: any;
    public canvas: HTMLCanvasElement
    public renderer: THREE.Renderer
    public composer;
    public clock: THREE.Clock = new THREE.Clock()
    public scene: THREE.Scene = new THREE.Scene()

    public camera1: THREE.Camera = new THREE.PerspectiveCamera(45, 1920 / 1080, 220, 5000000)
    public camera2: THREE.Camera = new THREE.PerspectiveCamera(45, 1920 / 1080, 220, 5000000)

    public fakeCamera: THREE.Camera;

    public allRunes: THREE.Mesh[] = []
    public allAsteroids: THREE.Mesh[] = []
    public bullets: Bullet[] = []

    public players: Player[] = []
    public controls
    public viewMode: ViewMode = 0;
    public player: Player;

    public earth: THREE.Mesh;
    public earthGlow: THREE.Mesh;

    //shooting
    public startTimeShooting: number = new Date().getTime();
    readonly durationBetweenShots: number = 300;
    public isShooting: boolean = false;

    //red zone
    public startTimeRedZone: number = new Date().getTime();
    public readonly durationBetweenZoneDamage: number = 1000;
    public readonly zoneRadius: number = 100000;

    public bokehPass;
    public dLight;

    public sparks = [];

    constructor() {
        this.animate = this.animate.bind(this);
    }

    start(canvas: HTMLCanvasElement, assets, settings) {
        this.assets = assets;
        this.canvas = canvas;

        this.fakeCamera = this.camera2.clone();

        // // lights
        this.dLight = new THREE.DirectionalLight(0xffffff, 1)

        this.dLight.position.set(800000, 0, 500000);//.normalize();
        this.dLight.castShadow = false

        // this.dLight.shadow.mapSize.width = 8000;  // default
        // this.dLight.shadow.mapSize.height = 8000; // default
        // this.dLight.shadow.camera.near = 10;    // default
        // this.dLight.shadow.camera.far = 5000;     // default

        // this.dLight.shadowMapWidth = this.dLight.shadowMapHeight = 1000
        this.dLight.intensity = 1.5
        this.scene.add(this.dLight)

        // const light = new THREE.HemisphereLight(0xffffff, 0x000000, 0.05);
        // this.scene.add(light);

        let ambient = new THREE.AmbientLight(0x000000)
        ambient.color.setHSL(0.01, 0.01, 0.005)
        this.scene.add(ambient)

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: settings.antialiasing, alpha: true })


        this.scene.add(addSky())

        addSun(this.dLight, this.assets)


        // this.postprocessing()
        this.animate()
    }

    postprocessing() {
        this.composer = new EffectComposer(this.renderer);

        var renderPass = new RenderPass(this.scene, this.camera1);
        this.composer.addPass(renderPass);

        this.bokehPass = new BokehPass(this.scene, this.camera1, { focus: 1, width: 1080, height: 1920, maxblur: 0.05 });
        this.composer.addPass(this.bokehPass);
    }

    updateGui(user) {
        this.player.params = user;

        scaleXLeft(this.player.mesh.getObjectByName('HP_GROUP').getObjectByName('hp'), this.player.params.health / 100);
    }

    userCreated(user) {
        const { position, rotation, shipType } = user;
        this.player = new Player(user);

        worker.post({ type: 'userCreated', user })

        const ship = this.assets.ship.scene.children[0].clone();



        this.player.setMesh(ship, position, rotation);

        // setTimeout(() => {
        ship.add(this.camera1)
        ship.add(this.camera2)
        // }, 3000)

        attachGUI(this.player.mesh, this.assets);

        this.initFirstPersonMode();

        const earth = addEarth(this.assets);

        this.earth = earth;
        this.scene.add(earth)

        const earthGlow = addAtosphere(this.camera1.getWorldPosition(this.camera1.position));
        earthGlow.position.copy(this.earth.position);
        this.earthGlow = earthGlow;
        this.scene.add(earthGlow);

        this.scene.add(ship)
    }

    addAsteroidsToScene(asteroids) {
        const asteroidsArray = addAsteroids(asteroids, this.assets);

        asteroidsArray.forEach(asteroid => {
            this.scene.add(asteroid)
            this.allAsteroids.push(asteroid)
        })
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

        scaleXLeft(this.player.mesh.getObjectByName('HP_GROUP').getObjectByName('hp'), 1);
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

        const ship = this.assets.ship.scene.children[0].clone();

        const font = this.assets.helvetiker_font;

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

        this.scene.add(ship)
        this.scene.add(userTextMesh)

        //should be after
        const enemy = new Player(user, userTextMesh);
        enemy.setMesh(ship, position, rotation);
        this.players.push(enemy);
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
                this.fire()
                this.startTimeShooting = new Date().getTime()
            }
        }
    }

    otherFire(params) {
        // let userMesh = this.players.find(r => r.params._id === params.userId).mesh
        // let pos = userMesh.position.clone()
        // let bullet = createBullet()
        // const direction = new THREE.Vector3(params.direction.x, params.direction.y, params.direction.z);

        // bullet.position.set(pos.x, pos.y, pos.z)
        // bullet.rotation.set(
        //     params.rotation._x,
        //     params.rotation._y,
        //     params.rotation._z
        // )

        // //offset
        // // bullet.translateZ(-50);

        // this.bullets.push(new Bullet(bullet, direction, false));

        // this.scene.add(bullet);

        // setTimeout(() => {
        //     if (bullet.parent) {
        //         this.scene.remove(bullet)
        //     }

        //     this.bullets = this.bullets.filter(b => b.mesh.id !== bullet.id);
        // }, 4000)
    }

    fire() {
        if (this.player && this.player.params) {
            // let bullet = createBullet()

            // let pos = this.player.mesh.position.clone()
            // let rot = this.player.mesh.rotation.clone()

            // bullet.position.set(pos.x, pos.y, pos.z)
            // bullet.rotation.set(rot.x, rot.y, rot.z)

            // const playerPos = this.player.mesh.position.clone();
            // const matrixWorld = this.player.mesh.matrixWorld.clone();
            // const direction = this.getDirectionOfBullet(matrixWorld, playerPos);

            // bullet.translateZ(-150);
            const bullet = new Bullet(this.player, true);
            this.bullets.push(bullet)

            this.scene.add(bullet.mesh);

            // SocketService.socket.emit('fire', {
            //     userId: this.player.params._id,
            //     direction: direction,
            //     rotation: rot,
            //     position: pos
            // })

            // setTimeout(() => {
            //     if (bullet.mesh.parent) {
            //         this.scene.remove(bullet.mesh)
            //     }

            //     this.bullets = this.bullets.filter(b => b.mesh.id !== bullet.mesh.id);
            // }, 4000)
        }
    }

    playSound(params) {
        // console.log('SOUND: ' + params.sound, params);
        const pos = new THREE.Vector3(params.position.x, params.position.y, params.position.z);
        params.volume = getVolumeFromDistance(this.player.mesh.position, pos);
        worker.post({ type: 'playSound', params })
    }


    redZoneIndicator() {
        let zoneProcentage = (Math.max(...this.player.mesh.position.toArray().map(r => Math.abs(r))) / this.zoneRadius) * 100;
        return zoneProcentage >= 100 ? 100 : zoneProcentage;
    }


    render(delta) {
        // let delta = this.clock.getDelta()

        if (this.controls) {
            const speed = this.controls.update(delta)

        }

        this.camera2.copy(this.fakeCamera);

        this.renderer.render(this.scene, this.viewMode === 0 ? this.camera1 : this.camera2)

        if (this.bokehPass) this.bokehPass.uniforms.maxblur.value -= this.bokehPass.uniforms.maxblur.value <= 0 ? 0 : 0.0003;
        if (this.bokehPass && this.bokehPass.uniforms.maxblur.value > 0) this.composer.render();

    }

    checkRedZone() {
        if (this.player && this.player.mesh) {
            let { x, y, z } = this.player.mesh.position;

            if (Math.abs(x) > this.zoneRadius || Math.abs(y) > this.zoneRadius || Math.abs(z) > this.zoneRadius) {
                const elapsed = new Date().getTime() - this.startTimeRedZone
                if (elapsed > this.durationBetweenZoneDamage) {
                    SocketService.socket.emit('outsideZone', this.player.params._id);
                    this.startTimeRedZone = new Date().getTime()
                }
            }

            scaleXRight(this.player.mesh.getObjectByName('ZONE_GROUP').getObjectByName('zone'), this.redZoneIndicator() / 100);
        }
    }

    animate() {
        requestAnimationFrame(this.animate)

        worker.post({ type: 'animateStart' })

        const delta = this.clock.getDelta()

        this.render(delta)
        this.shotAnimate()


        this.sparks.forEach((s) => s.update(this, delta));
        this.bullets.forEach(b => b.update(this, delta));

        for (let i = 0; i < this.allRunes.length; i++) {
            this.allRunes[i].rotation.y += 0.01
        }

        for (let i = 0; i < this.allAsteroids.length; i++) {
            this.allAsteroids[i].rotation.x += 0.0015
            this.allAsteroids[i].rotation.y += 0.0015
            this.allAsteroids[i].rotation.z += 0.0015
        }

        if (this.earth) {
            this.earth.rotation.y += 0.00004;
            this.earth.getObjectByName('clouds').rotation.z -= 0.00006;
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
            // this.player.mesh.getObjectByName('gui_hp').lookAt(this.camera1.getWorldPosition(this.camera1.position))
            // this.player.mesh.getObjectByName('gui_hp').quaternion.copy(this.camera1.quaternion)

            SocketService.socket.emit('move', {
                id: this.player.params._id,
                position: this.player.mesh.position,
                rotation: this.player.mesh.rotation
            })
        }

        // getPerformanceOfFunction(() => {
        if (this.allRunes.length && this.player && this.player.mesh) {
            runesCollisionDetection(this.player, this.allRunes)
        }

        if (this.bullets.length) {
            bulletsWithEnemyCollisionDetection(this.scene, this.players, this.bullets.filter(r => r.collision && !r.isDestroyed), this.player, this)
        }

        if (this.allAsteroids.length && this.player && this.player.mesh) {
            asteroidWithBulletCollision(this.allAsteroids, this.bullets.filter(r => r.collision && !r.isDestroyed), this);
        }
        // });
        // console.log(this.bullets.length ? this.bullets[0].mesh.position : '');


        this.checkRedZone();

        worker.post({ type: 'animateEnd' })
    }

    onResize(e) {
        if (this.renderer) {
            this.renderer.setSize(e.data.width, e.data.height)
            this.composer && this.composer.setSize(e.data.width, e.data.height);

            this.camera1['aspect'] = e.data.width / e.data.height
            this.camera1['updateProjectionMatrix']()

            this.camera2['aspect'] = e.data.width / e.data.height
            this.camera2['updateProjectionMatrix']()

            this.fakeCamera['aspect'] = e.data.width / e.data.height
            this.fakeCamera['updateProjectionMatrix']()
        }

    }

    datGui(value) {
        // if (value.p) this.earth.getObjectByName('glow')['material'].uniforms["p"].value = value.p;
        // if (value.c) this.earth.getObjectByName('glow')['material'].uniforms["c"].value = value.c;

        // if (value.x) this.player.mesh.getObjectByName('gui_hp').position.x = value.x;
        // if (value.y) this.player.mesh.getObjectByName('gui_hp').position.y = value.y;
        // if (value.z) this.player.mesh.getObjectByName('gui_hp').position.z = value.z;

    }

}


const game = new Game();

const worker = insideWorker(e => {
    const canvas = e.data.canvas
    if (canvas) {
        if (!canvas.style) canvas.style = { width: 0, height: 0 }

        Preloader().then(assets => {
            game.start(canvas, assets, e.data.settings);

            SocketService.socket.emit('join', e.data.opts)
            setTimeout(() => {
                worker.post({ type: 'preloader', enabled: false })
            }, 500)
        })

    }

    if (e.data.type === 'dat.gui') {
        game.datGui(e.data.value);
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
    .on('userUpdated', user => {
        worker.post({ type: 'userUpdated', user })

        game.updateGui(user);
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