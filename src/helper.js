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
        var textureFlare0 = loader.load("public/img/lensflare0.png");
        var textureFlare1 = loader.load("public/img/lensflare2.png");
        var textureFlare2 = loader.load("public/img/lensflare3.png");
        var light = new THREE.PointLight(0xffffff, 1.5, 450);
        light.color.setHSL(h, s, l);
        light.position.set(x, y, z);
        scene.add(light);

        var flareColor = new THREE.Color(0xffffff);
        flareColor.setHSL(h, s, l + 0.5);

        var lensflare = new THREE.Lensflare();
        lensflare.addElement(new THREE.LensflareElement(textureFlare0, 512, 0));
        lensflare.addElement(new THREE.LensflareElement(textureFlare1, 512, 0));
        lensflare.addElement(new THREE.LensflareElement(textureFlare2, 60, 0.6));

        lensflare.customUpdateCallback = Helpers.lensFlareUpdateCallback;
        lensflare.position.copy(light.position);

        scene.add(lensflare);
    },

    getRandColor: () => {
        return colors[Math.floor(Math.random() * colors.length)];
    },

    makeTextSprite: (message, parameters) => {
        if (parameters === undefined) parameters = {};

        var fontface = parameters.hasOwnProperty("fontface") ?
            parameters["fontface"] : "Arial";

        var fontsize = parameters.hasOwnProperty("fontsize") ?
            parameters["fontsize"] : 32;

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
        Helpers.roundRect(context, borderThickness / 2, borderThickness / 2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
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
    },

    getDateByFormat(format, date = new Date()) {
        let result = '';  
        let year = date.getFullYear().toString();
        let month = (date.getMonth() + 1).toString().length === 1 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1);
        let day = date.getDate().toString().length === 1 ? '0' + date.getDate() : date.getDate();
        let hh = date.getHours().toString().length === 1 ? '0' + date.getHours() : date.getHours();
        let mm = date.getMinutes().toString().length === 1 ? '0' + date.getMinutes() : date.getMinutes();
        let ss = date.getSeconds().toString().length === 1 ? '0' + date.getSeconds() : date.getSeconds();
        switch (format) {
            case 'yyyy-mm-dd':
                result = year + '-' + month + '-' + day;
                break;
            case 'yyyymmdd':
                result = year + month + day;
                break;
            case 'yyyy/mm/dd':
                result = year + '/' + month + '/' + day;
                break;
            case 'yyyy-mm-dd hh:mm':
                result = year + '-' + month + '-' + day + ' ' + hh + ':' + mm;
                break;
            case 'hh:mm':
                result = hh + ':' + mm;
                break;
            case 'hh:mm:ss':
                result = hh + ':' + mm + ':' + ss;
                break;
            case 'dd.mm.yyyy':
                result = day + '.' + month + '.' + year;
                break;
            case 'mmm dd, yyyy':
                result = `${monthNamesShort[date.getMonth()]} ${day}, ${year}`;
                break;
            default:
                result = year + '-' + month + '-' + day;
                break;
        }
        return result;
    },

    startTimer(duration, display) {
        var timer = duration, minutes, seconds;
        var interval = setInterval(function () {
            // minutes = parseInt(timer / 60, 10)
            seconds = parseInt(timer % 60, 10);

            // minutes = minutes < 10 ? "0" + minutes : minutes;
            // seconds = seconds < 10 ? "0" + seconds : seconds;

            display.textContent = /*minutes + ":" +*/ seconds;

            if (--timer < 0) {
                timer = duration;
                 display.textContent = '';
                clearInterval(interval);
            }
        }, 1000);
    }

}
export default Helpers;