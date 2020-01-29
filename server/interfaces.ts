export interface Vector3 {
   x: number;
   y: number;
   z: number;
}

export interface IUser {
   id: string;
   _id: string;
   playerName: string;
   health: number;
   death: number;
   kills: number;
   shipType: string;
   position: Vector3;
   rotation: Vector3;
}

export interface IRune {
   id: string;
   position: Vector3;
   rotation: Vector3;
}

export interface IAsteroid {
   id: string;
   health: number;
   size: number;
   position: Vector3;
   rotation: Vector3;
}

export interface IPlayerOptions {
   name: string;
   shipType: string;
}