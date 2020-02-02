import { CustomImageLoader, CustomModelLoader } from "./loaders";

export async function Preloader() {
    const array = [
        { url: "./images/earth_map.jpg", type: 'img', name: 'earth' },
        { url: "./images/bump_map.jpg", type: 'img', name: 'earth_bump' },
        { url: "./images/specular_map.jpg", type: 'img', name: 'earth_specular' },
        { url: "./images/clouds.jpg", type: 'img', name: 'earth_clouds' },
        { url: "./images/lensflare0.png", type: 'img', name: 'lens1'},
        { url: "./images/lensflare2.png", type: 'img', name: 'lens2'},
        { url: "./images/lensflare3.png", type: 'img', name: 'lens3'},
        { url: "./images/moonmap4k.jpg", type: 'img', name: 'moon'},
        { url: "./images/moonbump4k.jpg", type: 'img', name: 'moon_bump'},
       

        { url: "./models/simple-asteroid.glb", type: 'model', name: 'asteroid'},
        { url: "./models/ship.glb", type: 'model', name: 'ship'}
    ];

    const imgLoader = new CustomImageLoader();
    const modelLoader = new CustomModelLoader();

    return new Promise(async (resolve, reject) => {
        let assets = {};

        for (let i = 0; i <= array.length - 1; i++) {
            const item = array[i];
            if(item.type === 'img') assets[item.name] = await imgLoader.load(item.url);
            if(item.type === 'model') assets[item.name] = await modelLoader.load(item.url);
        }

        resolve(assets);
    });
}
