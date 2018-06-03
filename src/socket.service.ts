// import * as socketIo from 'socket.io-client';
// const SERVER_URL = 'http://localhost:8081';
declare var io:any = io;

class SocketService {
    public socket: any;
    constructor() {
    	// debugger;io;
        this.socket = io();//socketIo.Socket(SERVER_URL);
        // this.socket.initSocket();
    }
}

export default new SocketService();