export interface IVector3 {
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
   position: IVector3;
   rotation: IVector3;
}

export interface IRune {
   id: string;
   position: IVector3;
   rotation: IVector3;
}

export interface IAsteroid {
   id: string;
   health: number;
   size: number;
   position: IVector3;
   rotation: IVector3;
}

export interface IPlayerOptions {
   name: string;
   shipType: string;
}