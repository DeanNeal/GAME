import * as THREE from 'three'

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