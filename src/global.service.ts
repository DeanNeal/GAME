import SocketService from './socket.service';
import { Observable, Subject, ReplaySubject, BehaviorSubject, from, of, range } from 'rxjs';

class GlobalService {
    public users: any = new ReplaySubject();
    public user: any = new BehaviorSubject(null);
    public sceneControls: any = new ReplaySubject();
    public cubes = new BehaviorSubject([]);

    constructor() {
        SocketService.socket.on('userIsReady', (user:any) =>{
            this.user.next(user);
        });

        // SocketService.socket.on('userUpdated', (user:any) =>{
        //     this.user.next(user);
        // });

    	SocketService.socket.on('userList', (users: any, user:any) =>{
    		this.users.next(users);
    	});
    }
}

export default new GlobalService();