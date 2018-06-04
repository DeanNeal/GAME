declare var io: any;

class SocketService {
    public socket: any;
    constructor() {
        this.socket = io();

    }
}

export default new SocketService();