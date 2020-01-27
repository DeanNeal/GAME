import { Observable, Subject, ReplaySubject, BehaviorSubject, from, of, range } from 'rxjs';

type GameMode = 0 | 1;

class GlobalService {
    public users: any = new ReplaySubject();
    public user: any = new BehaviorSubject(null);
    public sceneControls: any = new ReplaySubject();
    public runes = new BehaviorSubject([]);
    public damage = new Subject();
    public toggleTab = new Subject();
    // public gameOver = new Subject();
    public viewMode = new BehaviorSubject<GameMode>(0);
    constructor() {
 
    }
}

export default new GlobalService();