
import * as io from 'socket.io-client';

class SocketService {
    public socket: any;
    constructor() {
        this.socket =  io();
    }
}

export default new SocketService();