import * as THREE from 'three';
export interface IGameOptions {
   name: string;
   color: string;
}

export interface IWorker {
   post: (a: any, b?: any) => void; 
   worker: Worker; 
}


export interface IAudio {
   audio: HTMLAudioElement;
   isMusic: boolean;
}

export interface IBullet {
   mesh: THREE.Mesh;
   notifyServer: boolean;
}