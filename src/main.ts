import './polyfills';
import Helpers from './helper';
import UserService from './user.service';
import CubesService from './cubes.service';
import SocketService from './socket.service';
// import GlobalService from './global.service';
import createPlanet from './planet';
declare var window: any;
declare var document: any;
declare var $: any;
import * as THREE from 'three'
import FlyControls from './FlyControls';
// import PersonControl from './3dPersonControl';
// import ShipControls from './shipControls';

// var ww = new Worker(getInlineJS());

import { Observable, Subject, ReplaySubject, BehaviorSubject, from, of, range } from 'rxjs';



export class Game {
    public container: any;
    public stats: any;

    public camera: any;
    public scene: any;
    public renderer: any;
    public projector: any;
    public raycaster: any;
    public controls: any;

    public mouse:any = new THREE.Vector2();
    // public INTERSECTED:any;

    public clock:any = new THREE.Clock();

    public allSpheres:any = [];
    public allCubes:any = [];
    public allAsteroids:any = [];
    public bullets:any = [];
    public othersBullets: any = [];

    // public COLLIDERS:any = [];
    public lastCollisionId: any;
    public lastBulletCollisionId: any;
    public InvisiblePlayer: any;
    // public currentPlayer: any;
    public players:any = [];
    public isMove: boolean = false;
    public earthMesh:any;
    public cloudMesh: any;
    public startPosition:any = { x: 0, y: 100, z: 100 };
    // public playerPosition:any = { x: 0, y: 0, z: 0 };
    public Earth: any;

    public rate = 10;
    public start = new Date().getTime();
    public duration = 120;
    public lastFrameNumber = 0;
    public isShooting: any = false;



    constructor(opts: any) {
        this.init();
        this.animate();
    }

    init() {
        this.container = document.createElement('div');
        this.container.className = 'canvas';
        document.body.appendChild(this.container);

        // camera

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 300000);
        this.camera.position.set(this.startPosition.x, this.startPosition.y, this.startPosition.z);
        // this.camera.position.set(0, 100, 100);
        // this.camera.rotation.set(0, 0, 0);

        this.scene = new THREE.Scene();
        this.addInvisiblePlayer();
        this.addPlanet();
        this.addSky();
        this.addCubes();
        this.addAsteroids();
        this.cubeWasRemoved();

        SocketService.socket.on('selfPlayer', (user: any)=> {
            UserService.user.next(user);
            this.players.push({ mesh: null, user: user });

        });

        SocketService.socket.on('updateUsersCoords', (users: any[])=>{
            users.forEach((user:any, i:any)=> {
                this.players.forEach((p:any) => {
                    if (p.mesh && p.user.id === user.id) {
                        p.mesh.position.set(user.position.x, user.position.y , user.position.z );
                        p.mesh.rotation.set(user.rotation._x, user.rotation._y, user.rotation._z);
                    }
                })
            });
        });


        SocketService.socket.on('otherNewPlayer', (users:any)=> {
            users.forEach(( user:any, i:any)=>  {
                let exists = this.players.map((x: any)=> { return x.user.id; }).indexOf(user.id);
               
                if (exists === -1 && user.id) {
                    this.createNewPlayer(user);
                }
            });
        });

        SocketService.socket.on('otherFire', (params:any)=> {
            // console.log(this.players);
            let userMesh = this.players.filter((r:any)=> r.user.id == params.userId)[0].mesh;
            let pos = userMesh.position.clone();
            let bulletMesh = this.createBullet();

            bulletMesh.position.set(pos.x, pos.y, pos.z);
            bulletMesh.rotation.set(params.rotation._x, params.rotation._y, params.rotation._z);

            this.othersBullets.push({
                mesh: bulletMesh,
                matrixWorld:  params.matrixWorld,
                camPos: params.camPos
            });

            setTimeout(()=>{
                this.scene.remove(bulletMesh);
                this.othersBullets.splice(0, 1);
            }, 3000);
        });

        SocketService.socket.on('deletePlayer', (userId:any)=> {
            console.log('deletePlayer');

            for (let i = 0; i < this.players.length; i++) {
                if (this.players[i].user.id === userId) {
                    this.scene.remove(this.players[i].mesh);
                    this.players.splice(i, 1);
                    return;
                }
            }
        });


        Observable
            .fromEvent(document, 'keydown')
            .subscribe((e:KeyboardEvent)=>{
                if(!this.isShooting) {
                    this.start = new Date().getTime() - this.duration;
                    this.isShooting = e;
                }
            })

        Observable
            .fromEvent(document, 'keyup')
            .subscribe((e:KeyboardEvent)=>{
                this.isShooting = null;
            })

        // lights
        let dLight:any = new THREE.DirectionalLight(0xffffff);
        dLight.position.set(2000, 2000, -6000);
        dLight.castShadow = true;
        dLight.shadowCameraVisible = true;
        dLight.shadowDarkness = 0.2;
        dLight.shadowMapWidth = dLight.shadowMapHeight = 1000;
        dLight.intensity = 4;
        this.scene.add(dLight);

        let ambient = new THREE.AmbientLight(0x000000);
        ambient.color.setHSL(0.01, 0.01, 0.4);
        this.scene.add(ambient);

        // Helpers.addLight(this.scene, 0.55, 0.9, 0.5, 2000, 2000, -25000);


        // renderer
        this.raycaster = new THREE.Raycaster();

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        //


        // stats

        // this.stats = new THREE.Stats();
        // this.container.appendChild(this.stats.domElement);

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    shot(e:KeyboardEvent) {
        if(e.keyCode === 32 && UserService.user.value) {
            let bullet = this.createBullet();

            let pos = this.InvisiblePlayer.position.clone();
            let rot = this.InvisiblePlayer.rotation.clone();
            bullet.position.set(pos.x, pos.y, pos.z);
            bullet.rotation.set(rot.x, rot.y, rot.z);

            this.bullets.push({
                mesh: bullet,
                matrixWorld:  this.InvisiblePlayer.matrixWorld.clone(),
                camPos: this.InvisiblePlayer.position.clone()
            });

            SocketService.socket.emit('fire', {
                userId: UserService.user.value.id,
                matrixWorld:  this.InvisiblePlayer.matrixWorld.clone(),
                camPos: this.InvisiblePlayer.position.clone(), 
                rotation: rot
            });

            setTimeout(()=>{
                this.scene.remove(bullet);
                this.bullets.splice(0, 1);
            }, 3000);
        }
    }

    createBullet() {
        let bullet = new THREE.Mesh(
        new THREE.CubeGeometry(5, 5, 2000),
        new THREE.MeshBasicMaterial({ color:0xffffff }));
        this.scene.add(bullet);
        return bullet;
    }

    createNewPlayer(user:any) {
        let newPlayer = this.createUserMesh();
        newPlayer.userData = {
            id: user.id 
        };
        newPlayer.position.set(0, 0, 0);

        let spritey = Helpers.makeTextSprite(user.playerName, { fontsize: 32, fontface: "Georgia" });
        spritey.position.set(50, 100, 0);
        newPlayer.add(spritey);

        this.players.push({ mesh: newPlayer, user: user });

        this.scene.add(newPlayer);
    }

    createUserMesh() {
        let loader = new THREE.TextureLoader();
        let texture = loader.load('img/sphere.png', function(texture) {
            texture.repeat.set(10, 10);
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.anisotropy = 16;
            // texture.needsUpdate = true;
            // texture.minFilter = THREE.LinearFilter;
        });
        let textureBump = loader.load('img/bump.png', function(texture) {
            textureBump.repeat.set(10, 10);
            textureBump.wrapS = textureBump.wrapT = THREE.RepeatWrapping;
            textureBump.anisotropy = 16;
            // textureBump.needsUpdate = true;
            // texture.minFilter = THREE.LinearFilter;
        });


        let userMesh = new THREE.Mesh(
            new THREE.SphereGeometry(70, 15, 15),
            new THREE.MeshPhongMaterial({
                // map: texture,
                // bumpMap: textureBump,
                color: 0xffff00,
                // specular: 0x0022ff,
                shininess: 1,
                // side: THREE.BackSide,
                // opacity: 1,
                // transparent: true
            })
        );

        userMesh.add(this.createGun());

        return userMesh;
    }

    addInvisiblePlayer() {
        this.InvisiblePlayer = this.createUserMesh();

        this.controls = new FlyControls(this.InvisiblePlayer, this.camera);
        // this.controls.enablePan = false;


        // this.controls.movementSpeed = 1000;
        this.controls.domElement = this.container;
        this.controls.rollSpeed = Math.PI / 3.5;
        this.controls.autoForward = false;
        this.controls.dragToLook = true;


        this.InvisiblePlayer.add(this.camera);
        this.InvisiblePlayer.position.set(0, 0, 0);
        this.InvisiblePlayer.rotation.set(0, 0, 0);


        var spriteMap = new THREE.TextureLoader().load( "img/aim.png" );
        var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap, color: 0xffffff } );
        var sprite = new THREE.Sprite( spriteMaterial );
        sprite.position.set(0, 0, -300);
        sprite.scale.set(15, 15, 15);

        this.camera.add(sprite);
        // this.camera.position.set(0, 100, 200);        
        this.scene.add(this.InvisiblePlayer);
    }

    createGun() {
        let cube = new THREE.BoxGeometry(25, 25, 100);
        let material = new THREE.MeshPhongMaterial({ color: 0x333333 , wireframe: false,specular: 0xffffff, shininess: 50 });
        let gun = new THREE.Mesh(cube, material);

        gun.position.set(0, 0, -50);
        return gun;
    }

    addPlanet() {
        var loader = new THREE.TextureLoader();
        var earthTexture = loader.load('img/mars.jpg', function(texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.offset.set(0, 0);
            texture.repeat.set(1, 1);
        });

        var earthMaterial = new THREE.MeshLambertMaterial({ map: earthTexture });
        var earthPlane:any = new THREE.Mesh(new THREE.PlaneGeometry(30000, 30000), earthMaterial);
        earthPlane.material.side = THREE.DoubleSide;
        earthPlane.position.x = 70000;
        earthPlane.position.z = 70000;
        earthPlane.position.y = 70000;

        // rotation.z is rotation around the z-axis, measured in radians (rather than degrees)
        // Math.PI = 180 degrees, Math.PI / 2 = 90 degrees, etc.
        earthPlane.rotation.z = 0.1 * Math.PI / 2;
        earthPlane.rotation.y = 0.5 * Math.PI / 2;



        this.scene.add(earthPlane);

        earthPlane.lookAt( earthPlane.worldToLocal( this.InvisiblePlayer.matrixWorld.getPosition() ) );

       // this.Earth = createPlanet({size: 10000});
       // this.Earth.position.x = 20000;
       // this.Earth.position.z = 20000;
       // this.Earth.position.y = 20000;
       // this.scene.add(this.Earth);
    }

    addSky() {
        let loader = new THREE.TextureLoader();
        // create the geometry sphere
        let geometry = new THREE.SphereGeometry(250000, 100, 100)
        let skyTexture = loader.load('img/galaxy_starfield.png', function(texture) {
            texture.repeat.set(10, 10);
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        });
        // create the material, using a texture of startfield
        let material = new THREE.MeshBasicMaterial({ map: skyTexture })
        // material.map = THREE.TextureLoader('img/sky.jpg')

        material.side = THREE.BackSide;
        // create the mesh based on geometry and material
        let galaxy = new THREE.Mesh(geometry, material)
        this.scene.add(galaxy);
    }

    addCubes() {
        let s = 150;
        let cube = new THREE.BoxGeometry(s, s, s);

        SocketService.socket.on('updateCubes', (cubes: any[])=> {
            // let loader = new THREE.TextureLoader();
            // let texture = loader.load('img/cyber2.jpg', function(texture) {
            //     texture.repeat.set(1, 1);
            //     texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            //     // texture.anisotropy = 16;
            //     // texture.needsUpdate = true;
            // });

            cubes.forEach(c => {
                let material = new THREE.MeshPhongMaterial({ color: c.color, wireframe: true,/*opacity: 0.5, transparent: true ,*/ specular: 0xffffff, shininess: 50 });
                let mesh = new THREE.Mesh(cube, material);

                mesh.userData = c;
                mesh.position.x = c.position.x;
                mesh.position.y = c.position.y;
                mesh.position.z = c.position.z;

                mesh.rotation.x = c.position.x;
                mesh.rotation.y = c.position.y;
                mesh.rotation.z = c.position.z;

                // var spritey = Helpers.makeTextSprite(c.id, { fontsize: 50, fontface: "Georgia" });
                // spritey.position.set(50, 100, 0);

                // mesh.add(spritey);

                // mesh.matrixAutoUpdate = false;
                // mesh.updateMatrix();

                this.scene.add(mesh);
                this.allCubes.push(mesh);
            });

            CubesService.cubes.next(this.allCubes);
        });
    }

    addAsteroids() {
    
       let s = 1000;
       let cube = new THREE.BoxGeometry(s, s, s);

       SocketService.socket.on('updateAsteroids', (asteroids: any[])=> {

           asteroids.forEach(c => {
               let material = new THREE.MeshPhongMaterial({ color: c.color, wireframe: false,/*opacity: 0.5, transparent: true ,*/ specular: 0xffffff, shininess: 50 });
               let mesh = new THREE.Mesh(cube, material);

               mesh.userData = c;
               mesh.position.x = c.position.x;
               mesh.position.y = c.position.y;
               mesh.position.z = c.position.z;

               mesh.rotation.x = c.position.x;
               mesh.rotation.y = c.position.y;
               mesh.rotation.z = c.position.z;


               this.scene.add(mesh);
               this.allAsteroids.push(mesh);
           });

           // CubesService.cubes.next(this.allCubes);
       });
    }

    cubeWasRemoved() {
        SocketService.socket.on('cubeWasRemoved', (cube: any)=> {
            for (let i = 0; i < this.allCubes.length; i++) {
                if (this.allCubes[i].userData.id === cube.id) {
                    this.scene.remove(this.allCubes[i]);
                    this.allCubes.splice(i, 1);
                    CubesService.cubes.next(this.allCubes);
                    if (this.allCubes.length === 0) {
                        SocketService.socket.emit('startAgain');
                        this.startTimer();
                    }
                    return;
                }
            };
        });
    }

    startTimer() {
        let fiveMinutes = 5,
             display = document.querySelector('#timer');
         Helpers.startTimer(fiveMinutes, display);
    }

    onWindowResize(event: Event) {

        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

      
        for (let i = 0; i < this.allCubes.length; i++) {
            // allCubes[i].position.x += 1;
            this.allCubes[i].rotation.y += 0.01;
            // allCubes[i].rotation.z += 0.2;
        };


        for (let i = 0; i < this.bullets.length; i++) {
            //Pick a point in front of the camera in camera space:
            var pLocal = new THREE.Vector3( 0, 0, -1 );
            // //Now transform that point into world space:
            var pWorld = pLocal.applyMatrix4(this.bullets[i].matrixWorld);
            // //You can now construct the desired direction vector:
            var dir = pWorld.sub(this.bullets[i].camPos).normalize();
            this.bullets[i].mesh.position.add(dir.multiplyScalar(1000));
        };

        for (let i = 0; i < this.othersBullets.length; i++) {
            var pLocal = new THREE.Vector3( 0, 0, -1 );
            var pWorld = pLocal.applyMatrix4(this.othersBullets[i].matrixWorld);
            var dir = pWorld.sub(this.othersBullets[i].camPos).normalize();
            this.othersBullets[i].mesh.position.add(dir.multiplyScalar(1000));
        };


        // var vec = new THREE.Vector3( 0, 0, 150 );
        // vec.applyQuaternion( this.camera.quaternion );

        // var vector = new THREE.Vector3( 0, 0, -1 );
        // vector.applyQuaternion( this.camera.quaternion );

        // this.InvisiblePlayer.position.copy( vector );
        // this.InvisiblePlayer.position.x = this.camera.position.x /* - this.InvisiblePlayer.geometry.parameters.radius*/ ;
        // this.InvisiblePlayer.position.y = this.camera.position.y /* - this.InvisiblePlayer.geometry.parameters.radius*/ ;
        // this.InvisiblePlayer.position.z = this.camera.position.z /* - this.InvisiblePlayer.geometry.parameters.radius*/ ;

        // this.InvisiblePlayer.rotation.x = this.camera.rotation.x;
        // this.InvisiblePlayer.rotation.y = this.camera.rotation.y;
        // this.InvisiblePlayer.rotation.z = this.camera.rotation.z;

        // if(this.speedUp) {
        //     this.spaceshipSpeed = Math.min(this.topSpeed, this.spaceshipSpeed + 0.001);
        // } else if(this.slowDown) {
        //     this.spaceshipSpeed = Math.max(0.003, this.spaceshipSpeed - 0.002);
        // }
        // this.InvisiblePlayer.position.z -= this.spaceshipSpeed;


        // this.camera.position.z = this.InvisiblePlayer.position.z + 0.5 + this.spaceshipSpeed*4;
        // this.camera.lookAt(new THREE.Vector3(0, 0, this.camera.position.z -1));


        // this.camera.position.x = this.InvisiblePlayer.position.x + 0.5 + 20*4;
        // this.camera.position.y = this.InvisiblePlayer.position.y + 0.5 + 20*4;
        // this.camera.position.z = this.InvisiblePlayer.position.z + 0.5 + 20*4;

        if (UserService.user.value) {
            SocketService.socket.emit("move", { position: this.InvisiblePlayer.position, rotation: this.InvisiblePlayer.rotation });
        }

        $('#position').html('Position: ' + this.InvisiblePlayer.position.x.toFixed(0) + ' ' + this.InvisiblePlayer.position.y.toFixed(0) + ' ' + this.InvisiblePlayer.position.z.toFixed(0));
        $('#rotation').html('Rotation: ' + this.InvisiblePlayer.rotation.x.toFixed(2) + ' ' + this.InvisiblePlayer.rotation.y.toFixed(2) + ' ' + this.InvisiblePlayer.rotation.z.toFixed(2));

        if (this.allCubes.length) {
            this.cubesCollisionDetection();
        }

        if (this.bullets.length) {
            this.damageCollisionDetection();
        }
        

        this.render();

        this.shotAnimate();
    }

    shotAnimate() {
        let cl =  this.clock.getElapsedTime();

        var elapsed = new Date().getTime() - this.start;
// console.log(elapsed);
       if (elapsed > this.duration) {
            if(this.isShooting) {
                this.shot(this.isShooting);
            }
            this.start = new Date().getTime();
       }
    }

    cubesCollisionDetection() {
        let originPoint = this.InvisiblePlayer.position.clone();

        for (let vertexIndex = 0; vertexIndex < this.InvisiblePlayer.geometry.vertices.length; vertexIndex++) {
            let localVertex = this.InvisiblePlayer.geometry.vertices[vertexIndex].clone();
            let globalVertex = localVertex.applyMatrix4(this.InvisiblePlayer.matrix);
            let directionVector = globalVertex.sub(this.InvisiblePlayer.position);
            let ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
            let collisionResults = ray.intersectObjects(this.allCubes);
            if (collisionResults.length > 0 && collisionResults[0].distance <= directionVector.length()) {
                let obj = collisionResults[0].object;
                if (obj.id !== this.lastCollisionId) {
                    // console.log(obj.id);
                    this.lastCollisionId = obj.id;

                    // obj.material.opacity = 0.4;
                    // obj.material.transparent = true;
                    // scene.remove(obj);

                    SocketService.socket.emit('removeCube', obj.userData);
                    SocketService.socket.emit('increaseScores');
                }
            }
        }
    }

    damageCollisionDetection () {
        this.players.filter((r:any)=> r.mesh).forEach((player:any)=>{
            let plMesh = player.mesh;
            let originPoint = plMesh.position.clone();

            for (let vertexIndex = 0; vertexIndex < plMesh.geometry.vertices.length; vertexIndex++) {
                let localVertex = plMesh.geometry.vertices[vertexIndex].clone();
                let globalVertex = localVertex.applyMatrix4(plMesh.matrix);
                let directionVector = globalVertex.sub(plMesh.position);
                let ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());

                let collisionResults = ray.intersectObjects(this.bullets.map((r: any)=> r.mesh));
                if (collisionResults.length > 0 && collisionResults[0].distance <= directionVector.length()) {
                    let obj:any = collisionResults[0].object;

                    if (obj.id !== this.lastBulletCollisionId) {
                        this.lastBulletCollisionId = obj.id;
                        SocketService.socket.emit('demage', player.user.id);
                        // this.scene.remove(obj);
                        obj.material.opacity = 0;
                        obj.material.transparent = true;
                    }
                }
            }
        });
    }


    render() {

        let delta = this.clock.getDelta();

        this.controls.update(delta);
        // this.controls.updateShip(delta);
        this.renderer.render(this.scene, this.camera);

    }
}
