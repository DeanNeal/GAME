import { Observable, Subject, ReplaySubject, BehaviorSubject, from, of, range } from 'rxjs';

type GameMode = 0 | 1;

const soundsEnabled = JSON.parse(localStorage.getItem('soundsEnabled')) === null ? true : JSON.parse(localStorage.getItem('soundsEnabled'));
const musicEnabled = JSON.parse(localStorage.getItem('musicEnabled')) === null ?  true : JSON.parse(localStorage.getItem('musicEnabled'));

class GlobalService {
    public users: any = new ReplaySubject();
    public user: any = new BehaviorSubject(null);
    public sceneControls: any = new ReplaySubject();
    public runes = new BehaviorSubject([]);
    public damage = new Subject();
    public toggleTab = new Subject();
    // public backToMain= new Subject();

    public viewMode = new BehaviorSubject<GameMode>(0);

    public soundsEnabled = new BehaviorSubject<boolean>(soundsEnabled);
    public musicEnabled = new BehaviorSubject<boolean>(musicEnabled);

    constructor() {
 
    }

    public setSoundsEnabled(state: boolean): void {
        localStorage.setItem('soundsEnabled', state as any);
        this.soundsEnabled.next(state);
    }

    public setMusicEnabled(state: boolean): void {
        localStorage.setItem('musicEnabled', state as any);
        this.musicEnabled.next(state);
    }
}

export default new GlobalService();