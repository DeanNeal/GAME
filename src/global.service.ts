import SocketService from './socket.service';
import { Observable, Subject, ReplaySubject, from, of, range } from 'rxjs';

class GlobalService {
    public users: any = new ReplaySubject();
    public sceneControls: any = new ReplaySubject();
    
    constructor() {
    	SocketService.socket.on('userList', (users: any) =>{
    		this.users.next(users);
    	});
    }
}

export default new GlobalService();