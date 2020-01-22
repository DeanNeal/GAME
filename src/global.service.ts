import SocketService from './socket.service';
import { Observable, Subject, ReplaySubject, BehaviorSubject, from, of, range } from 'rxjs';

class GlobalService {
    public users: any = new ReplaySubject();
    public user: any = new BehaviorSubject(null);
    public sceneControls: any = new ReplaySubject();
    public cubes = new BehaviorSubject([]);
    public damage = new Subject();

    constructor() {
 
    }
}

export default new GlobalService();