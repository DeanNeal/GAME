import * as THREE from 'three'
import GLTFLoader from './three/GLTFLoader';

export class CustomImageLoader {

    load(url) {
        const loader = new THREE.ImageBitmapLoader()
        return new Promise((resolve, reject) => {
            loader.load(url, (imageBitmap: any) => {
                resolve(new THREE.CanvasTexture(imageBitmap))
            },
                () => { },
                (e) => reject(e)
            );
        });
    }

}

export class CustomModelLoader {
    load(url) {
        const loader = new GLTFLoader();
        return new Promise((resolve, reject) => {
            loader['load'](url, (object: any) => {
                resolve(object)
            },
                () => { },
                (e) => reject(e)
            );
        });
    }
}

export class CustomFontLoader {
    load(url) {
        const loader = new THREE.FontLoader()
        return new Promise((resolve, reject) => {
            loader['load'](url, (object: any) => {
                resolve(object)
            },
                () => { },
                (e) => reject(e)
            );
        });
    }
}