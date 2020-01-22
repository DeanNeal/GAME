
export default function socketIoInit() {
    // var colliderSystem  = new THREEx.ColliderSystem();
    var container, stats;

    var camera, scene, renderer, projector, raycaster, controls;

    var mouse = new THREE.Vector2(),
        INTERSECTED;

    var clock = new THREE.Clock();

    var allSpheres = [],
        allCubes = [],
        COLLIDERS = [],
        lastCollisionId,
        InvisiblePlayer,
        currentPlayer,
        players = [];


    var allUsers = $("#users ul");


    var isMove = false;
    var earthMesh, cloudMesh;
    var startPosition = { x: 1000, y: 1000, z: 1000 },
        playerPosition = { x: 0, y: 0, z: 0 };


    init();
    animate();


    function init() {

        container = document.createElement('div');
        container.className = 'canvas';
        document.body.appendChild(container);

        // camera

        camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 200000);
        camera.position.set(startPosition.x, startPosition.y, startPosition.z);

        // camera.lookAt();

        InvisiblePlayer = new THREE.Mesh(
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
        InvisiblePlayer.position.set(0, 0, 0);
        // camera.add(InvisiblePlayer);



        controls = new THREE.FlyControls(camera); //new THREE.FirstPersonControls(camera);


        controls.movementSpeed = 1000;
        controls.domElement = container;
        controls.rollSpeed = Math.PI / 3;
        controls.autoForward = false;
        controls.dragToLook = true;

        // controls.dragToLook = false;
        // controls.rollSpeed = Math.PI / 6;

        // scene


        scene = new THREE.Scene();

        scene.add(InvisiblePlayer);
        //  scene.fog = new THREE.Fog( 0x000000, 3500, 15000 );
        //  scene.fog.color.setHSL( 0.51, 0.4, 0.01 );

        // world

        var s = 150;
        var cube = new THREE.BoxGeometry(s, s, s);



        window.socket.on('updateCubes', function(cubes) {
            var loader = new THREE.TextureLoader();
            var texture = loader.load('img/cyber2.jpg', function(texture) {
                texture.repeat.set(1, 1);
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                // texture.anisotropy = 16;
                // texture.needsUpdate = true;
            });

            cubes.forEach(c => {
                var material = new THREE.MeshPhongMaterial({ color: c.color, wireframe: false,/*opacity: 0.5, transparent: true ,*/ specular: 0xffffff, shininess: 50 });
                var mesh = new THREE.Mesh(cube, material);

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

                scene.add(mesh);
                allCubes.push(mesh);
            });

            CubesService.cubes.next(allCubes);
        });

        window.socket.on('cubeWasRemoved', function(cube) {
            for (var i = 0; i < allCubes.length; i++) {
                if (allCubes[i].userData.id === cube.id) {
                    scene.remove(allCubes[i]);
                    allCubes.splice(i, 1);
                    CubesService.cubes.next(allCubes);
                    if (allCubes.length === 0) {
                        window.socket.emit('startAgain');
                        startTimer();
                    }
                    return;
                }
            };
        });


        function startTimer() {
            var fiveMinutes = 5,
                 display = document.querySelector('#timer');
             Helpers.startTimer(fiveMinutes, display);
        }


        //Earth 

        // var earthTexture, earthMaterial, earthPlane;

        var loader = new THREE.TextureLoader();
        var earthTexture = loader.load('img/earth-from-space.jpg', function(texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.offset.set(0, 0);
            texture.repeat.set(1, 1);
        });

        var earthMaterial = new THREE.MeshLambertMaterial({ map: earthTexture });
        var earthPlane = new THREE.Mesh(new THREE.PlaneGeometry(150000, 150000), earthMaterial);
        earthPlane.material.side = THREE.DoubleSide;
        earthPlane.position.x = 70000;
        earthPlane.position.z = 70000;
        earthPlane.position.y = 40000;

        // rotation.z is rotation around the z-axis, measured in radians (rather than degrees)
        // Math.PI = 180 degrees, Math.PI / 2 = 90 degrees, etc.
        earthPlane.rotation.z = 0.1 * Math.PI / 2;
        earthPlane.rotation.y = 0.5 * Math.PI / 2;

        // scene.add(earthPlane);






        // create the geometry sphere
        // var geometry = new THREE.SphereGeometry(150000, 32, 32)
        // var skyTexture = loader.load('img/sky.jpg', function(texture) {
        //     // texture.wrapS = THREE.RepeatWrapping;
        //     // texture.wrapT = THREE.RepeatWrapping;
        //     // texture.repeat.x = 1;
        //     // texture.repeat.y = 1;
        //     texture.repeat.set(1, 1);
        //     texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        //     // textureBump.wrapS = textureBump.wrapT = THREE.RepeatWrapping;
        // });
        // // create the material, using a texture of startfield
        // var material = new THREE.MeshBasicMaterial({ map: skyTexture })
        // // material.map = THREE.TextureLoader('img/sky.jpg')

        // material.side = THREE.BackSide;
        // // create the mesh based on geometry and material
        // var galaxy = new THREE.Mesh(geometry, material)
        // scene.add(galaxy);



        var texture = loader.load('img/sphere.png', function(texture) {
            texture.repeat.set(10, 10);
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.anisotropy = 16;
            texture.needsUpdate = true;
        });

        var textureBump = loader.load('img/bump.png', function(texture) {
            textureBump.repeat.set(10, 10);
            textureBump.wrapS = textureBump.wrapT = THREE.RepeatWrapping;
            textureBump.anisotropy = 16;
            textureBump.needsUpdate = true;
        });

        var mlib = [
            new THREE.MeshPhongMaterial({ color: 0xFF62B0 }),
            new THREE.MeshPhongMaterial({ color: 0x9A03FE, opacity: 0.5, transparent: true }),
            new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0x000088 }),
            new THREE.MeshPhongMaterial({ color: 0xff0000 }),
            new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0x004000, specular: 0x0022ff }),
            new THREE.MeshPhongMaterial({ color: 0xff0000, specular: 0x0022ff, shininess: 3 }),
            new THREE.MeshLambertMaterial({ map: texture, color: 0xff0000, specular: 0x0022ff, shininess: 3 }),
            new THREE.MeshPhongMaterial({ map: texture, color: 0xff0000 }),
            new THREE.MeshPhongMaterial({ map: texture, color: 0xff0000, specular: 0x0022ff, shininess: 3 }),
            new THREE.MeshPhongMaterial({ map: texture, bumpMap: textureBump, color: 0xffffff }),
            new THREE.MeshPhongMaterial({ map: texture, bumpMap: textureBump, color: 0xff0000, specular: 0x0022ff }),
            new THREE.MeshPhongMaterial({ map: texture, bumpMap: textureBump, color: 0xff00ff, specular: 0x0022ff, shininess: 3 }),
            new THREE.MeshPhongMaterial({ map: texture, bumpMap: textureBump, color: 0x00ff00, specular: 0x0022ff, shininess: 3 })
        ];


        var self = this;

        var drawSphere = function(x, z, material) {
            var cube = new THREE.Mesh(new THREE.SphereGeometry(70, 70, 20), material);
            cube.position.x = x;
            cube.position.y = 0;
            cube.position.z = z;
            cube.castShadow = cube.receiveShadow = true;
            scene.add(cube);
            allSpheres.push(cube);
        }

        // mlib.forEach((meshTexture, i) => {
        //     drawSphere(200 * i, 200 * i, meshTexture);
        // });


        //Player
        var createNewPlayer = function(user) {
            var newPlayer = new THREE.Mesh(
                new THREE.SphereGeometry(80, 32, 32),
                new THREE.MeshPhongMaterial({
                    map: texture,
                    bumpMap: textureBump,
                    color: 0x00ff00,
                    specular: 0x0022ff,
                    shininess: 3
                })
            );

            newPlayer.position.set(0, 50, 300);

            var spritey = Helpers.makeTextSprite(user.playerName, { fontsize: 32, fontface: "Georgia" });
            spritey.position.set(50, 100, 0);
            newPlayer.add(spritey);

            players.push({ mesh: newPlayer, user: user });

            scene.add(newPlayer);
        }

        window.socket.on('updateUsersCoords', function(users) {
            $.each(users, function(i, player) {
                if (player.id == UserService.getUser().id) return;

                players.forEach(p => {
                    if (p.user.id === player.id) {
                        p.mesh.position.set(player.position.x, player.position.y - playerPosition.y, player.position.z - playerPosition.z);
                        p.mesh.rotation.set(player.rotation._x, player.rotation._y, player.rotation._z);
                    }
                })
            });
        });

        window.socket.on('otherNewPlayer', function(params) {
            let users = params.users;
            let curUser = params.currentPlayer;
            $.each(users, function(i, user) {
                let exists = players.map(function(x) { return x.user.id; }).indexOf(user.id);
                if (UserService.getUser().id !== user.id && exists === -1) {
                    createNewPlayer(user);
                    // window.socket.emit("move", { position: camera.position, rotation: camera.rotation });
                }
            });
        });

        window.socket.on('deletePlayer', function(userId) {
            console.log('deletePlayer');

            for (var i = 0; i < players.length; i++) {
                if (players[i].user.id === userId) {
                    scene.remove(players[i].mesh);
                    players.splice(i, 1);
                    return;
                }
            }
        });

        $(window).on('keydown', function() {
            isMove = true;
        });
        $(window).on('keyup', function() {
            isMove = false;
        });

        //

        // lights
        var dLight = new THREE.DirectionalLight(0xffffff);
        dLight.position.set(2000, 2000, -6000);
        dLight.castShadow = true;
        dLight.shadowCameraVisible = true;
        // dLight.shadowDarkness = 0.2;
        // dLight.shadowMapWidth = dLight.shadowMapHeight = 1000;
        dLight.intensity = 4;
        scene.add(dLight);


        // particleLight = new THREE.Mesh( new THREE.SphereGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffffaa }));
        // particleLight.position = dLight.position;
        // this.scene.add(particleLight);


        var ambient = new THREE.AmbientLight(0x000000);
        ambient.color.setHSL(0.01, 0.01, 0.21);
        scene.add(ambient);


        // var dirLight = new THREE.DirectionalLight( 0xffffff, 0.125 );
        // dirLight.position.set( 0, -1, 0 ).normalize();
        // scene.add( dirLight );

        // dirLight.color.setHSL( 0.1, 0.7, 0.5 );

        // lens flares
        Helpers.addLight(scene, 0.55, 0.9, 0.5, 2000, 2000, -25000);


        // renderer
        raycaster = new THREE.Raycaster();

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        //

        renderer.gammaInput = true;
        renderer.gammaOutput = true;

        // stats

        stats = new Stats();
        container.appendChild(stats.domElement);

        // events

        document.addEventListener('mousedown', onDocumentMouseDown, false);
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        window.addEventListener('resize', onWindowResize, false);

    }


    function onWindowResize(event) {

        renderer.setSize(window.innerWidth, window.innerHeight);

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

    }

    function onDocumentMouseMove(event) {

        event.preventDefault();

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    }

    function onDocumentMouseDown(event) {

        // event.preventDefault();

        // raycaster.setFromCamera(mouse, camera);

        // var intersects = raycaster.intersectObjects(allSpheres);

        // if (intersects.length > 0) {

        //     if (INTERSECTED != intersects[0].object) {

        //         if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

        //         INTERSECTED = intersects[0].object;
        //         // INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
        //         // INTERSECTED.material.emissive.setHex( 0xff0000 );

        //         // new TWEEN.Tween( camera.position ).to( {
        //         //      x: 1000,
        //         //      y: 0,
        //         //      z: 2000 } )
        //         //  .easing( TWEEN.Easing.Elastic.Out).start();

        //     }

        // } else {

        //     if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

        //     INTERSECTED = null;

        // }



    }


    //

    function animate() {

        requestAnimationFrame(animate);



        // for (var i = 0; i < allSpheres.length; i++) {
        //     allSpheres[i].rotation.y += 0.02;
        // };
        // var delta = clock.getDelta();

        for (let i = 0; i < allCubes.length; i++) {
            // allCubes[i].position.x += 1;
            allCubes[i].rotation.y += 0.01;
            // allCubes[i].rotation.z += 0.2;
        };

        // for (let i = 0; i < players.length; i++) {
        //     // allCubes[i].position.x += 1;
        //     players[i].mesh.position.x += 1 * Math.random(1,30);
        //     players[i].mesh.position.y += 1 * Math.random(1,30);
        //     players[i].mesh.position.z += 1 * Math.random(1,30);
        //     // allCubes[i].rotation.z += 0.2;
        // };


        // InvisiblePlayer.position.x += 1;
        InvisiblePlayer.position.x = camera.position.x /* - InvisiblePlayer.geometry.parameters.radius*/ ;
        InvisiblePlayer.position.y = camera.position.y /* - InvisiblePlayer.geometry.parameters.radius*/ ;
        InvisiblePlayer.position.z = camera.position.z /* - InvisiblePlayer.geometry.parameters.radius*/ ;

        InvisiblePlayer.rotation.x = camera.rotation.x;
        InvisiblePlayer.rotation.y = camera.rotation.y;
        InvisiblePlayer.rotation.z = camera.rotation.z;
        // earthMesh.rotation.y += 1 / 10000;


        // cloudMesh.rotation.y += 1 / 9000;


        // if (isMove) {
        if (UserService.getUser()) {
            window.socket.emit("move", { position: camera.position, rotation: camera.rotation });
        }
        //  }
        $('#position').html('Position: ' + InvisiblePlayer.position.x.toFixed(0) + ' ' + InvisiblePlayer.position.y.toFixed(0) + ' ' + InvisiblePlayer.position.z.toFixed(0));
        $('#rotation').html('Rotation: ' + camera.rotation.x.toFixed(2) + ' ' + camera.rotation.y.toFixed(2) + ' ' + camera.rotation.z.toFixed(2));

        if (camera.position.x > 20000 || camera.position.y > 20000 || camera.position.z > 20000) {
            camera.position.set(startPosition.x, startPosition.y, startPosition.z);
        }

        // if (camera.position.x > -20000 || camera.position.y > -20000 || camera.position.z > -20000) {
        //     camera.position.set(startPosition.x, startPosition.y, startPosition.z);
        // }

        render();
        if (allCubes.length) {
            collisionDetection();
        }

        stats.update();
    }

    function collisionDetection() {
        var originPoint = InvisiblePlayer.position.clone();

        for (var vertexIndex = 0; vertexIndex < InvisiblePlayer.geometry.vertices.length; vertexIndex++) {
            var localVertex = InvisiblePlayer.geometry.vertices[vertexIndex].clone();
            var globalVertex = localVertex.applyMatrix4(InvisiblePlayer.matrix);
            var directionVector = globalVertex.sub(InvisiblePlayer.position);
            var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
            var collisionResults = ray.intersectObjects(allCubes);
            if (collisionResults.length > 0 && collisionResults[0].distance <= directionVector.length()) {
                let obj = collisionResults[0].object;
                if (obj.id !== lastCollisionId) {
                    console.log(obj.id);
                    lastCollisionId = obj.id;

                    // obj.material.opacity = 0.4;
                    // obj.material.transparent = true;
                    // scene.remove(obj);

                    window.socket.emit('removeCube', obj.userData);
                    window.socket.emit('increaseScores');
                }
            }
        }
    }


    function render() {

        var delta = clock.getDelta();

        controls.update(delta);
        renderer.render(scene, camera);

    }

}