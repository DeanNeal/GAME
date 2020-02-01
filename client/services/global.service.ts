import { Observable, Subject, ReplaySubject, BehaviorSubject, from, of, range } from 'rxjs';

type GameMode = 0 | 1;

const soundsEnabled = JSON.parse(localStorage.getItem('soundsEnabled')) === null ? true : JSON.parse(localStorage.getItem('soundsEnabled'));
const musicEnabled = JSON.parse(localStorage.getItem('musicEnabled')) === null ? true : JSON.parse(localStorage.getItem('musicEnabled'));

class InitState {
    name: string;
    shipType: string;
    constructor() {
        this.name = 'new player'
        this.shipType = 'default'
    }
}

class GlobalService {
    public currentPage = new BehaviorSubject('mainMenu');
    public inGame = new BehaviorSubject(false);
    public inMenu = new BehaviorSubject(true);
    public gameInstance = new BehaviorSubject(null);
    public playerOptions = new BehaviorSubject(new InitState());
    public users: any = new ReplaySubject();
    public user: any = new BehaviorSubject(null);
    public sceneControls: any = new ReplaySubject();
    public runes = new BehaviorSubject([]);
    public damage = new Subject();
    // public toggleTab = new Subject();


    public gui = new Subject();
    public viewMode = new BehaviorSubject<GameMode>(0);
    public preloader = new Subject();

    public soundsEnabled = new BehaviorSubject<boolean>(soundsEnabled);
    public musicEnabled = new BehaviorSubject<boolean>(musicEnabled);

    constructor() {

    }

    public resetPlayerOptions() {
        this.playerOptions.next(new InitState());
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