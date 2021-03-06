import insideWorker from './inside-worker'


// import OrbitControls from './controls/OrbitControls';

import SocketService from '../services/socket.service'

import * as THREE from 'three'

import { PlayerControls } from './controls/PlayerControls'

import { EffectComposer } from './three/post-processing/EffectComposer';
import { RenderPass } from './three/post-processing/RenderPass'

import { BokehPass } from './three/post-processing/BokehPass';

import { addAsteroids, addAtosphere, addRunes, addSky, addSun, addEarth } from './environment'
import { runesCollisionDetection, bulletCollision } from './collision'
import { getVolumeFromDistance, getPerformanceOfFunction } from './utils'
import { Player } from './entities/player';
import { Preloader } from './preloader';
import { attachGUI, scaleXLeft, scaleXRight } from './gui';
import { Bullet } from './entities/bullet';
import { Sparks } from './entities/sparks';
import { ViewMode } from '../services/global.service';


class Game {
    public assets: any;
    public canvas: HTMLCanvasElement
    public renderer: THREE.Renderer
    public composer;
    public clock: THREE.Clock = new THREE.Clock()
    public scene: THREE.Scene = new THREE.Scene()

    public camera1: THREE.Camera = new THREE.PerspectiveCamera(45, 1920 / 1080, 100, 5000000)
    // public camera2: THREE.Camera = new THREE.PerspectiveCamera(45, 1920 / 1080, 100, 5000000)

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


        // this.fakeCamera = this.camera2.clone();

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
        const ship = this.assets.ship.scene.children[0].clone();

        ship.add(this.camera1)
        // ship.add(this.camera2)

        this.player = new Player(user, ship, false, this.assets);

        worker.post({ type: 'userCreated', user })



        attachGUI(this.player.mesh, this.assets);

        this.controls = new PlayerControls(this.player.mesh, this.canvas, this.camera1)
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

    newPlayerJoined(users) {
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
        const ship = this.assets.ship.scene.children[0].clone();
        ship.name = 'ship';

        const enemy = new Player(user, ship, true, this.assets);

        this.scene.add(ship)
        this.scene.add(enemy.userTextMesh)

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

                    p.speed = user.speed;
                }
            })
        })
    }

    createSparks(params) {
        const sparks = new Sparks(params.size, this.assets);

        sparks.mesh.position.copy(params.collisionPosition);

        this.sparks.push(sparks);
        this.scene.add(sparks.mesh)
    }

    initFirstPersonMode() {
        this.camera1.position.set(0, 50, 40);
        this.camera1.rotation.set(0, 0, 0);

        this.controls.setViewMode(0);

        this.controls.minDistance = 550;
        this.controls.maxDistance = 500000;

        this.controls.movementSpeed = 1000
        this.controls.domElement = this.canvas;
        this.controls.autoForward = false
        this.controls.dragToLook = false
        this.camera1.up = new THREE.Vector3(0, 1, 0);


        this.player.mesh.getObjectByName('GUI').visible = true;
    }

    initThirdPersonMode() {

        this.camera1.position.set(0, 220, 1000);
        this.camera1.rotation.set(-0.02, 0, 0);
        this.controls.setViewMode(1);

   
        this.player.mesh.getObjectByName('GUI').visible = false;
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

    otherFire(id) {
        let userMesh = this.players.find(r => r.params._id === id).mesh
        const bullet = new Bullet(userMesh);

        // //offset
        bullet.mesh.translateZ(-350);

        this.bullets.push(bullet);
        this.scene.add(bullet.mesh);
    }

    fire() {
        if (this.player && this.player.params) {

            const bullet = new Bullet(this.player.mesh, true);
            bullet.mesh.translateZ(-350);
            this.bullets.push(bullet)

            this.scene.add(bullet.mesh);
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

    render(delta) {
        // let delta = this.clock.getDelta()

        if (this.controls) {
            const speed = this.controls.update(delta)
            this.player.speed = speed;
            worker.post({ type: 'speed', speed })
            // const speedGroup: any = this.player.mesh.getObjectByName('SPEED_GROUP');

            // for (var i = speedGroup.children.length - 1; i >= 0; i--) {
            //     speedGroup.remove(speedGroup.children[i]);
            // }

            // speedGroup.add(createSpeedLabel(this.assets, speed.toString()));

        }

        // this.camera2.copy(this.fakeCamera);

        this.renderer.render(this.scene, this.camera1);///this.viewMode === 0 ? this.camera1 : this.camera2)

        if (this.bokehPass) this.bokehPass.uniforms.maxblur.value -= this.bokehPass.uniforms.maxblur.value <= 0 ? 0 : 0.0003;
        if (this.bokehPass && this.bokehPass.uniforms.maxblur.value > 0) this.composer.render();

    }

    animate() {
        requestAnimationFrame(this.animate)

        worker.post({ type: 'animateStart' })

        const delta = this.clock.getDelta()
        const elapsed = this.clock.getElapsedTime();


        this.shotAnimate()

        this.render(delta)


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


                // if (this.viewMode === 0) {
                user.userTextMesh.lookAt(this.player.mesh.position)
                user.userTextMesh.quaternion.copy(this.player.mesh.quaternion);
                // } else {
                // user.userTextMesh.lookAt(this.camera2.getWorldPosition(this.camera2.position))
                // user.userTextMesh.quaternion.copy(this.camera2.getWorldQuaternion(this.camera2.quaternion));
                // }

            }
        })

        this.players.forEach(p => p.update(delta));
        if (this.player && this.player.mesh) {
            this.player.update(delta);
            SocketService.socket.emit('move', {
                id: this.player.params._id,
                speed: this.player.speed,
                position: this.player.mesh.position,
                rotation: this.player.mesh.rotation
            })
        }

        // getPerformanceOfFunction(() => {
        if (this.allRunes.length && this.player && this.player.mesh) {
            runesCollisionDetection(this.player, this.allRunes)
        }

        // if (this.bullets.length) {
        //     bulletsWithEnemyCollisionDetection(this.scene, this.players, this.bullets.filter(r => r.collision && !r.isDestroyed), this.player)
        // }

        // if (this.allAsteroids.length && this.player && this.player.mesh) {
        //     asteroidWithBulletCollision(this.allAsteroids, this.bullets.filter(r => r.collision && !r.isDestroyed), this);
        // }
        bulletCollision([...this.allAsteroids, ...this.players.map(r => r.mesh.children[0])], this.bullets.filter(r => r.collision && !r.isDestroyed), this);

        this.checkRedZone();

        worker.post({ type: 'animateEnd' })
    }

    onResize(e) {
        if (this.renderer) {
            this.renderer.setSize(e.data.width, e.data.height)
            this.composer && this.composer.setSize(e.data.width, e.data.height);

            this.camera1['aspect'] = e.data.width / e.data.height
            this.camera1['updateProjectionMatrix']()

            // this.camera2['aspect'] = e.data.width / e.data.height
            // this.camera2['updateProjectionMatrix']()

            // this.fakeCamera['aspect'] = e.data.width / e.data.height
            // this.fakeCamera['updateProjectionMatrix']()
        }

    }

    datGui(value) {
        if (value.p) this.scene.getObjectByName('glow')['material'].uniforms["p"].value = value.p;
        if (value.c) this.scene.getObjectByName('glow')['material'].uniforms["c"].value = value.c;

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

    if (e.data.type === 'inMenu') {
        game.controls.disabled = e.data.value;
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
    .on('newPlayerJoined', users => {
        game.newPlayerJoined(users);
    })
    .on('otherFire', id => {
        game.otherFire(id);
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
    })
    .on('createSparks', (params) => {
        game.createSparks(params);
    })