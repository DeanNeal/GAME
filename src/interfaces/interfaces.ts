
export interface IGameOptions {
   name: string;
   color: string;
}

export interface IWorker {
   post: (a: any, b?: any) => void; 
   worker: Worker; 
}