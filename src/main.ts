import Helpers from './helper';
import UserService from './user.service';
import CubesService from './cubes.service';
import SocketService from './socket.service';
declare var window: any;
declare var document: any;
declare var $: any;
import * as THREE from 'three'
import FlyControls from './FlyControls';

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
    public INTERSECTED:any;

    public clock:any = new THREE.Clock();

    public allSpheres:any = [];
    public allCubes:any = [];
    // public COLLIDERS:any = [];
    public lastCollisionId: any;
    public InvisiblePlayer: any;
    public currentPlayer: any;
    public players:any = [];
    public isMove: boolean = false;
    public earthMesh:any;
    public cloudMesh: any;
    public startPosition:any = { x: 1000, y: 1000, z: 1000 };
    public playerPosition:any = { x: 0, y: 0, z: 0 };

    constructor(opts: any) {

        this.init();
        this.animate();
    }

    init() {
        this.container = document.createElement('div');
        this.container.className = 'canvas';
        document.body.appendChild(this.container);

        // camera

        this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 200000);
        this.camera.position.set(this.startPosition.x, this.startPosition.y, this.startPosition.z);


        this.controls = new FlyControls(this.camera); //new THREE.FirstPersonControls(camera);


        this.controls.movementSpeed = 1000;
        this.controls.domElement = this.container;
        this.controls.rollSpeed = Math.PI / 3;
        this.controls.autoForward = false;
        this.controls.dragToLook = true;

        // controls.dragToLook = false;
        // controls.rollSpeed = Math.PI / 6;




        this.scene = new THREE.Scene();
        this.addInvisiblePlayer();
        this.addEarth();
        this.addSky();
        this.addCubes();
        this.cubeWasRemoved();


        SocketService.socket.on('updateUsersCoords', (users: any[])=>{
            $.each(users, (i:any, player:any)=> {
                if (player.id == UserService.getUser().id) return;

                this.players.forEach((p:any) => {
                    if (p.user.id === player.id) {
                        p.mesh.position.set(player.position.x, player.position.y - this.playerPosition.y, player.position.z - this.playerPosition.z);
                        p.mesh.rotation.set(player.rotation._x, player.rotation._y, player.rotation._z);
                    }
                })
            });
        });

        SocketService.socket.on('otherNewPlayer', (params:any)=> {
            let users = params.users;
            let curUser = params.currentPlayer;
            $.each(users, (i:any, user:any)=>  {
                let exists = this.players.map((x: any)=> { return x.user.id; }).indexOf(user.id);
                if (UserService.getUser().id !== user.id && exists === -1) {
                    this.createNewPlayer(user);
                    // SocketService.socket.emit("move", { position: camera.position, rotation: camera.rotation });
                }
            });
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

        $(window).on('keyup', (e: KeyboardEvent)=> {
            if(e.key === "Control") {
                let bullet = new THREE.Mesh(
                new THREE.SphereGeometry(20,8,8),
                new THREE.MeshBasicMaterial({ color:0xffffff });
                let pos = this.InvisiblePlayer.position.clone();
                bullet.position.set(pos.x, pos.y, pos.z - 200);
                this.scene.add(bullet);
            }
        });



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

        Helpers.addLight(this.scene, 0.55, 0.9, 0.5, 2000, 2000, -25000);


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

    // let drawSphere = function(x:any, z:any, material:any) {
    //     let cube = new THREE.Mesh(new THREE.SphereGeometry(70, 70, 20), material);
    //     cube.position.x = x;
    //     cube.position.y = 0;
    //     cube.position.z = z;
    //     cube.castShadow = cube.receiveShadow = true;
    //     this.scene.add(cube);
    //     this.allSpheres.push(cube);
    // }

    createNewPlayer(user:any) {
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

        let newPlayer = new THREE.Mesh(
            new THREE.SphereGeometry(80, 20, 20),
            new THREE.MeshPhongMaterial({
                map: texture,
                bumpMap: textureBump,
                color: 0x00ff00,
                specular: 0x0022ff,
                shininess: 3
            })
        );

        newPlayer.position.set(0, 0, 0);

        let spritey = Helpers.makeTextSprite(user.playerName, { fontsize: 32, fontface: "Georgia" });
        spritey.position.set(50, 100, 0);
        newPlayer.add(spritey);

        this.players.push({ mesh: newPlayer, user: user });

        this.scene.add(newPlayer);
    }

    addInvisiblePlayer() {
        this.InvisiblePlayer = new THREE.Mesh(
            new THREE.SphereGeometry(200, 9, 9),
            new THREE.MeshPhongMaterial({
                // map: texture,
                // bumpMap: textureBump,
                color: 0x00ff00,
                // specular: 0x0022ff,
                // shininess: 3
                // side: THREE.BackSide,
                opacity: 1,
                transparent: true
            })
        );
        this.InvisiblePlayer.position.set(0, 0, 0);
        this.scene.add(this.InvisiblePlayer);
    }

    addEarth() {
        //Earth 

        // var earthTexture, earthMaterial, earthPlane;

        let loader = new THREE.TextureLoader();
        let earthTexture = loader.load('img/earth-from-space.jpg', function(texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.offset.set(0, 0);
            texture.repeat.set(1, 1);
        });

        let earthMaterial = new THREE.MeshLambertMaterial({ map: earthTexture });
        let earthPlane = new THREE.Mesh(new THREE.PlaneGeometry(150000, 150000), earthMaterial);
        // earthPlane.material.side = THREE.DoubleSide;
        earthPlane.position.x = 70000;
        earthPlane.position.z = 70000;
        earthPlane.position.y = 40000;

        // rotation.z is rotation around the z-axis, measured in radians (rather than degrees)
        // Math.PI = 180 degrees, Math.PI / 2 = 90 degrees, etc.
        earthPlane.rotation.z = 0.1 * Math.PI / 2;
        earthPlane.rotation.y = 0.5 * Math.PI / 2;

        this.scene.add(earthPlane);
    }

    addSky() {
        let loader = new THREE.TextureLoader();
        // create the geometry sphere
        let geometry = new THREE.SphereGeometry(150000, 100, 100)
        let skyTexture = loader.load('img/galaxy_starfield.png', function(texture) {
            texture.repeat.set(7, 7);
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

                mesh.rotation.x = Math.random() * Math.PI;
                mesh.rotation.y = Math.random() * Math.PI;
                mesh.rotation.z = Math.random() * Math.PI;

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


        this.InvisiblePlayer.position.x = this.camera.position.x /* - this.InvisiblePlayer.geometry.parameters.radius*/ ;
        this.InvisiblePlayer.position.y = this.camera.position.y /* - this.InvisiblePlayer.geometry.parameters.radius*/ ;
        this.InvisiblePlayer.position.z = this.camera.position.z /* - this.InvisiblePlayer.geometry.parameters.radius*/ ;

        this.InvisiblePlayer.rotation.x = this.camera.rotation.x;
        this.InvisiblePlayer.rotation.y = this.camera.rotation.y;
        this.InvisiblePlayer.rotation.z = this.camera.rotation.z;

        if (UserService.getUser()) {
            SocketService.socket.emit("move", { position: this.camera.position, rotation: this.camera.rotation });
        }

        $('#position').html('Position: ' + this.camera.position.x.toFixed(0) + ' ' + this.camera.position.y.toFixed(0) + ' ' + this.camera.position.z.toFixed(0));
        $('#rotation').html('Rotation: ' + this.camera.rotation.x.toFixed(2) + ' ' + this.camera.rotation.y.toFixed(2) + ' ' + this.camera.rotation.z.toFixed(2));

        if (this.allCubes.length) {
            this.collisionDetection();
        }

        this.render();
    }

    collisionDetection() {
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
                    console.log(obj.id);
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


    render() {

        let delta = this.clock.getDelta();

        this.controls.update(delta);
        this.renderer.render(this.scene, this.camera);

    }
}
