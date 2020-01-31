import { CustomImageLoader } from "./loaders";

export async function Preloader() {
    const array = [
        { url: "./images/earth_map.jpg", name: 'earth' },
        { url: "./images/bump_map.jpg", name: 'earth_bump' },
        { url: "./images/specular_map.jpg", name: 'earth_specular' },
        { url: "./images/clouds.jpg", name: 'earth_clouds' },
        { url: "./images/lensflare0.png", name: 'lens1'},
        { url: "./images/lensflare2.png", name: 'lens2'},
        { url: "./images/lensflare3.png", name: 'lens3'},
    ];

    const loader = new CustomImageLoader();

    return new Promise(async (resolve, reject) => {
        let assets = {};

        for (let i = 0; i <= array.length - 1; i++) {
            const item = array[i];
            assets[item.name] = await loader.load(item.url);
        }

        resolve(assets);
    });
}
