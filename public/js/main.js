var socket = io();
// $('#start-the-game').on('click', function() {
//     var playerOptions = {},
//         name = $('#your-name').val();
//     //   color = $(".colors .active").data('color');

//     if (!name) {
//         alert('Please enter your name');
//         return;
//     }

//     playerOptions.name = name;

//     hidePopup();
//     socketIoInit(playerOptions);
// });



// $('.chat-menu').on('click', (e)=>{
//     e.stopPropagation();
// });


// $('#messageInput').keypress(function(e) {
//     var key = e.which,
//         message = $(e.currentTarget),
//         messageValue = message.val();

//     if (key == 13) // the enter key code
//     {
//         if (messageValue) {

//             socket.emit('chat message', { msg: messageValue, name: currentPlayer.playerName });

//             message.val('');
//         }
//         return false;
//     }


// });


// socket.on('chat message', function(data) {
//     var template = $('<li class="new-message"><p>' + data.name + '<span class="date">12.05.2015</span></p>' + '<span>' + data.msg + '</span></li>');
//     $('#messages').append(template);

//     setTimeout(function() {
//         $(".messages .new-message:first").removeClass('new-message');
//     }, 5000);

//     if ($('#messages li').length > 50) {
//         $('#messages li:first').remove();
//     }

//     $(".messages").animate({ scrollTop: $(".messages").prop("scrollHeight") }, 0);
// });




var socketIoInit = function() {

    var container, stats;

    var camera, scene, renderer, projector, raycaster;

    var mouse = new THREE.Vector2(),
        INTERSECTED;

    var clock = new THREE.Clock();

    var allCubes = [],
        Player,
        currentPlayer = {},
        players = [];


    var welcome = $("#welcome"),
        allUsers = $("#users ul");
    // progress = $("#progress");

    var isMove = false;

    var startPosition = { x: 1000, y: 0, z: 2000 },
        playerPosition = { x: 0, y: 50, z: 300 };


    init();
    animate();


    function init() {

        container = document.createElement('div');
        container.className = 'canvas';
        document.body.appendChild(container);

        // camera

        camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 200000);
        camera.position.set(startPosition.x, startPosition.y, startPosition.z);


        controls = new THREE.FlyControls(camera);

        controls.movementSpeed = 500;
        controls.domElement = container;
        controls.rollSpeed = Math.PI / 6;
        controls.autoForward = false;
        controls.dragToLook = true;

        // scene


        scene = new THREE.Scene();
        //  scene.fog = new THREE.Fog( 0x000000, 3500, 15000 );
        //  scene.fog.color.setHSL( 0.51, 0.4, 0.01 );

        // world

        // var s = 50;

        // var cube = new THREE.BoxGeometry( s, s, s );
        // var material = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0xffffff, shininess: 50 } );


        // for ( var i = 0; i < 1000; i ++ ) {

        //  var mesh = new THREE.Mesh( cube, material );

        //  mesh.position.x = 8000 * ( 2.0 * Math.random() - 1.0 );
        //  mesh.position.y = 8000 * ( 2.0 * Math.random() - 1.0 );
        //  mesh.position.z = 8000 * ( 2.0 * Math.random() - 1.0 );

        //  mesh.rotation.x = Math.random() * Math.PI;
        //  mesh.rotation.y = Math.random() * Math.PI;
        //  mesh.rotation.z = Math.random() * Math.PI;

        //  mesh.matrixAutoUpdate = false;
        //  mesh.updateMatrix();

        //  scene.add( mesh );

        // }

        //Earth 

        var earthTexture, earthMaterial, earthPlane;

        earthTexture = THREE.ImageUtils.loadTexture("img/earth-from-space.jpg");

        // assuming you want the texture to repeat in both directions:
        earthTexture.wrapS = THREE.RepeatWrapping;
        earthTexture.wrapT = THREE.RepeatWrapping;

        // how many times to repeat in each direction; the default is (1,1),
        //   which is probably why your example wasn't working
        // earthTexture.repeat.set( 4, 4 ); 

        earthMaterial = new THREE.MeshLambertMaterial({ map: earthTexture });
        earthPlane = new THREE.Mesh(new THREE.PlaneGeometry(150000, 150000), earthMaterial);
        earthPlane.material.side = THREE.DoubleSide;
        earthPlane.position.x = 70000;
        earthPlane.position.z = 70000;
        earthPlane.position.y = 40000;

        // rotation.z is rotation around the z-axis, measured in radians (rather than degrees)
        // Math.PI = 180 degrees, Math.PI / 2 = 90 degrees, etc.
        earthPlane.rotation.z = 0.1 * Math.PI / 2;
        earthPlane.rotation.y = 0.5 * Math.PI / 2;

        scene.add(earthPlane);




        var texture = THREE.ImageUtils.loadTexture('img/sphere.png');
        texture.repeat.set(10, 10);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = 16;
        // texture.needsUpdate = true;

        var textureBump = THREE.ImageUtils.loadTexture('img/bump.png');
        textureBump.repeat.set(10, 10);
        textureBump.wrapS = textureBump.wrapT = THREE.RepeatWrapping;
        textureBump.anisotropy = 16;
        // textureBump.needsUpdate = true;

        var mlib = [
            new THREE.MeshPhongMaterial({ color: 0xFF62B0 }),
            new THREE.MeshPhongMaterial({ color: 0x9A03FE, opacity: 0.5, transparent: true }),
            new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0x000088 }),
            new THREE.MeshPhongMaterial({ color: 0xff0000, ambient: 0x3ffc33 }),
            new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0x004000, specular: 0x0022ff }),
            new THREE.MeshPhongMaterial({ color: 0xff0000, specular: 0x0022ff, shininess: 3 }),
            new THREE.MeshLambertMaterial({ map: texture, color: 0xff0000, specular: 0x0022ff, shininess: 3 }),
            new THREE.MeshPhongMaterial({ map: texture, color: 0xff0000, ambient: 0x3ffc33 }),
            new THREE.MeshPhongMaterial({ map: texture, color: 0xff0000, specular: 0x0022ff, shininess: 3 }),
            new THREE.MeshPhongMaterial({ map: texture, bumpMap: textureBump, color: 0xffffff, ambient: 0x3ffc33 }),
            new THREE.MeshPhongMaterial({ map: texture, bumpMap: textureBump, color: 0xff0000, specular: 0x0022ff }),
            new THREE.MeshPhongMaterial({ map: texture, bumpMap: textureBump, color: 0xff00ff, specular: 0x0022ff, shininess: 3 }),
            new THREE.MeshPhongMaterial({ map: texture, bumpMap: textureBump, color: 0x00ff00, specular: 0x0022ff, shininess: 3 })
        ];


        var self = this;

        this.drawSphere = function(x, z, material) {
            var cube = new THREE.Mesh(new THREE.SphereGeometry(70, 70, 20), material);
            cube.position.x = x;
            cube.position.y = 0;
            cube.position.z = z;
            cube.castShadow = cube.receiveShadow = true;
            scene.add(cube);
            allCubes.push(cube);
        }

        mlib.forEach((meshTexture, i) => {
            self.drawSphere(200 * i, 200 * i, meshTexture);
        });

        // $.each(mlib, function(i, meshTexture) {

        // });




        function makeTextSprite(message, parameters) {
            if (parameters === undefined) parameters = {};

            var fontface = parameters.hasOwnProperty("fontface") ?
                parameters["fontface"] : "Arial";

            var fontsize = parameters.hasOwnProperty("fontsize") ?
                parameters["fontsize"] : 18;

            var borderThickness = parameters.hasOwnProperty("borderThickness") ?
                parameters["borderThickness"] : 4;

            var borderColor = parameters.hasOwnProperty("borderColor") ?
                parameters["borderColor"] : { r: 0, g: 0, b: 0, a: 1.0 };

            var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
                parameters["backgroundColor"] : { r: 255, g: 255, b: 255, a: 1.0 };


            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            context.font = "Bold " + fontsize + "px " + fontface;

            // get size data (height depends only on font size)
            var metrics = context.measureText(message);
            var textWidth = metrics.width;

            // background color
            // context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
            //                            + backgroundColor.b + "," + backgroundColor.a + ")";
            // // border color
            // context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
            //                            + borderColor.b + "," + borderColor.a + ")";

            context.lineWidth = borderThickness;
            roundRect(context, borderThickness / 2, borderThickness / 2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
            // 1.4 is extra height factor for text below baseline: g,j,p,q.

            // text color
            context.fillStyle = "rgba(255, 255, 255, 1.0)";

            context.fillText(message, borderThickness, fontsize + borderThickness);

            // canvas contents will be used for a texture
            var texture = new THREE.Texture(canvas)
            texture.needsUpdate = true;

            var spriteMaterial = new THREE.SpriteMaterial({ map: texture, useScreenCoordinates: false });
            var sprite = new THREE.Sprite(spriteMaterial);
            sprite.scale.set(100, 50, 1.0);
            return sprite;
        }

        function roundRect(ctx, x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }



        //Player

        this.createNewPlayer = function(name, playerName) {

            var newPlayer = new THREE.Mesh(
                new THREE.SphereGeometry(50, 32, 32),
                new THREE.MeshPhongMaterial({
                    map: texture,
                    bumpMap: textureBump,
                    color: 0x00ff00,
                    specular: 0x0022ff,
                    shininess: 3
                })
            );

            newPlayer.position.set(0, 50, 300);
            newPlayer.name = name;
            newPlayer.playerName = playerName;


            var spritey = makeTextSprite(playerName, { fontsize: 32, fontface: "Georgia" });
            spritey.position.set(50, 100, 0);
            newPlayer.add(spritey);

            players.push(newPlayer);

            return newPlayer;
        }

        socket.on('selfPlayer', function(params) {
            let users = params.users;
            let curUser = params.currentPlayer;
            currentPlayer = curUser;
            allUsers.empty();
            $.each(users, function(i, player) {
                allUsers.append('<li data-id="' + player.name + '">' + player.playerName + '<span></span></li>');
            });
        });

        socket.on('updateUsers', function(users) {
            $.each(users, function(i, player) {
                if (player.name == currentPlayer.name) return;

                players.forEach(p=>{           
                    if (p.name === player.name) {
                        p.position.set(player.position.x, player.position.y - playerPosition.y, player.position.z - playerPosition.z);
                        p.rotation.set(player.rotation._x, player.rotation._y, player.rotation._z);
                    }
                })
            });
        });

        socket.on('otherNewPlayer', function(params) {
            let users = params.users;
            let curUser = params.currentPlayer;
            $.each(users, function(i, user) {
                if (currentPlayer.name !== user.name) {
                    allUsers.empty();
                    $.each(users, function(i, player) {
                        allUsers.append('<li data-id="' + player.name + '">' + player.playerName + '<span></span></li>');
                    });
                    scene.add(self.createNewPlayer(user.name, user.playerName));
                }
            });
        });

        socket.on('deletePlayer', function(playerName) {
            console.log('deletePlayer');

            allUsers.find('[data-id=' + playerName + ']').remove();

            var elementPos;
            $.each(players, function(i, item) {

                if (item.name == playerName) {
                    elementPos = players.map(function(x) { return x.name; }).indexOf(item.name);
                    scene.remove(item);
                }
            });
            players.splice(elementPos, 1);
        });

        $(window).on('keydown', function() {
            isMove = true;
        });
        $(window).on('keyup', function() {
            isMove = false;
        });



        // $('.chatRoom').hover(function(){
        //  controls.dragToLook = true;
        //  controls.rollSpeed = 0;
        // }, function(){
        //  controls.dragToLook = false;
        //  controls.rollSpeed = Math.PI / 6;
        // });


        //  $('#info span').html(Player.position.x);

        // var colors = [
        //     0xFF62B0,
        //     0x9A03FE,
        //     0x62D0FF,
        //     0x48FB0D,
        //     0xDFA800,
        //     0xC27E3A,
        //     0x990099,
        //     0x9669FE,
        //     0x23819C,
        //     0x01F33E,
        //     0xB6BA18,
        //     0xFF800D,
        //     0xB96F6F,
        //     0x4A9586
        // ];

        // function getRandColor() {
        //     return colors[Math.floor(Math.random() * colors.length)];
        // }




        //

        // lights
        var dLight = new THREE.DirectionalLight(0xffffff);
        dLight.position.set(2000, 2000, -6000);
        dLight.castShadow = true;
        // dLight.shadowCameraVisible = true;
        dLight.shadowDarkness = 0.2;
        dLight.shadowMapWidth = dLight.shadowMapHeight = 1000;
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

        var textureFlare0 = THREE.ImageUtils.loadTexture("img/lensflare0.png");
        var textureFlare2 = THREE.ImageUtils.loadTexture("img/lensflare2.png");
        var textureFlare3 = THREE.ImageUtils.loadTexture("img/lensflare3.png");

        addLight(0.55, 0.9, 0.5, 2000, 2000, -6000);
        // addLight( 0.55, 0.9, 0.5, 5000, 0, -1000 );
        // addLight( 0.08, 0.8, 0.5,    0, 0, -1000 );
        // addLight( 0.995, 0.5, 0.9, 5000, 5000, -1000 );

        function addLight(h, s, l, x, y, z) {

            var light = new THREE.PointLight(0xffffff, 1.5, 4500);
            light.color.setHSL(h, s, l);
            light.position.set(x, y, z);
            scene.add(light);

            var flareColor = new THREE.Color(0xffffff);
            flareColor.setHSL(h, s, l + 0.5);

            var lensFlare = new THREE.LensFlare(textureFlare0, 700, 0.0, THREE.AdditiveBlending, flareColor);

            lensFlare.add(textureFlare2, 512, 0.0, THREE.AdditiveBlending);
            lensFlare.add(textureFlare2, 512, 0.0, THREE.AdditiveBlending);
            lensFlare.add(textureFlare2, 512, 0.0, THREE.AdditiveBlending);

            lensFlare.add(textureFlare3, 60, 0.6, THREE.AdditiveBlending);
            lensFlare.add(textureFlare3, 70, 0.7, THREE.AdditiveBlending);
            lensFlare.add(textureFlare3, 120, 0.9, THREE.AdditiveBlending);
            lensFlare.add(textureFlare3, 70, 1.0, THREE.AdditiveBlending);

            lensFlare.customUpdateCallback = lensFlareUpdateCallback;
            lensFlare.position.copy(light.position);

            scene.add(lensFlare);

        }

        // renderer
        raycaster = new THREE.Raycaster();

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        //renderer.setClearColor( scene.fog.color );
        //renderer.setClearColor( 0xffffff );
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

    function lensFlareUpdateCallback(object) {

        var f, fl = object.lensFlares.length;
        var flare;
        var vecX = -object.positionScreen.x * 2;
        var vecY = -object.positionScreen.y * 2;


        for (f = 0; f < fl; f++) {

            flare = object.lensFlares[f];

            flare.x = object.positionScreen.x + vecX * flare.distance;
            flare.y = object.positionScreen.y + vecY * flare.distance;

            flare.rotation = 0;

        }

        object.lensFlares[2].y += 0.025;
        object.lensFlares[3].rotation = object.positionScreen.x * 0.5 + THREE.Math.degToRad(45);

    }

    //

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

        event.preventDefault();

        raycaster.setFromCamera(mouse, camera);

        var intersects = raycaster.intersectObjects(allCubes);

        if (intersects.length > 0) {

            if (INTERSECTED != intersects[0].object) {

                if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

                INTERSECTED = intersects[0].object;
                // INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
                // INTERSECTED.material.emissive.setHex( 0xff0000 );

                // new TWEEN.Tween( camera.position ).to( {
                //      x: 1000,
                //      y: 0,
                //      z: 2000 } )
                //  .easing( TWEEN.Easing.Elastic.Out).start();

            }

        } else {

            if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

            INTERSECTED = null;

        }



    }


    //

    function animate() {

        requestAnimationFrame(animate);



        for (var i = 0; i < allCubes.length; i++) {
            allCubes[i].rotation.y += 0.02;
        };

        //if(isMove){
        socket.emit("move", { position: camera.position, rotation: camera.rotation });
        $('#position').html('Position: ' + camera.position.x.toFixed(0) + ' ' + camera.position.y.toFixed(0) + ' ' + camera.position.z.toFixed(0));
        $('#rotation').html('Rotation: ' + camera.rotation.x.toFixed(2) + ' ' + camera.rotation.y.toFixed(2) + ' ' + camera.rotation.z.toFixed(2));
        //}
        if (camera.position.x > 10000 || camera.position.y > 10000 || camera.position.z > 10000) {
            camera.position.set(startPosition.x, startPosition.y, startPosition.z);
        }

        render();
        stats.update();

    }

    function render() {

        var delta = clock.getDelta();

        controls.update(delta);
        renderer.render(scene, camera);

    }

}