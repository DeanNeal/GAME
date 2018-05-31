var colors = [
    '#FF62B0',
    '#9A03FE',
    '#62D0FF',
    '#48FB0D',
    '#DFA800',
    '#C27E3A',
    '#990099',
    '#9669FE',
    '#23819C',
    '#01F33E',
    '#B6BA18',
    '#FF800D',
    '#B96F6F',
    '#4A9586'
];

let Helpers = {
    roundRect: (ctx, x, y, w, h, r) => {
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
    },
    lensFlareUpdateCallback: (object) => {

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

    },
    addLight: (scene, h, s, l, x, y, z) => {
    	var loader = new THREE.TextureLoader();
    	var textureFlare0 = loader.load( "img/lensflare0.png" );
    	var textureFlare1 = loader.load( "img/lensflare2.png" );
    	var textureFlare2 = loader.load( "img/lensflare3.png" );
        var light = new THREE.PointLight(0xffffff, 1.5, 450);
        light.color.setHSL(h, s, l);
        light.position.set(x, y, z);
        scene.add(light);

        var flareColor = new THREE.Color(0xffffff);
        flareColor.setHSL(h, s, l + 0.5);

        var lensflare = new THREE.Lensflare();
        lensflare.addElement( new THREE.LensflareElement( textureFlare0, 512, 0 ) );
        lensflare.addElement( new THREE.LensflareElement( textureFlare1, 512, 0 ) );
        lensflare.addElement( new THREE.LensflareElement( textureFlare2, 60, 0.6 ) );

        lensflare.customUpdateCallback = Helpers.lensFlareUpdateCallback;
        lensflare.position.copy(light.position);

        scene.add(lensflare);
    },




    getRandColor: ()=> {
        return colors[Math.floor(Math.random() * colors.length)];
    }

}
export default Helpers;