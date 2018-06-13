import SocketService from './socket.service';
import { Observable, Subject, ReplaySubject, BehaviorSubject, from, of, range } from 'rxjs';

class GlobalService {
    public users: any = new ReplaySubject();
    public user: any = new BehaviorSubject(null);
    public sceneControls: any = new ReplaySubject();
    public cubes = new ReplaySubject();

    constructor() {
    	SocketService.socket.on('userList', (users: any, user:any) =>{
    		this.users.next(users);
    		this.user.next(users.filter((r:any)=> r.id === this.user.value.id)[0]);
    	});
    }
}

export default new GlobalService();