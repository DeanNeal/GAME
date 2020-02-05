import { Observable, Subject, ReplaySubject, BehaviorSubject, from, of, range } from 'rxjs';

type GameMode = 0 | 1;

const globalSettings = JSON.parse(localStorage.getItem('globalSettings')) || {
    antialiasing: true,
    sounds: true,
    music: true
};

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


    public speed = new Subject();
    public viewMode = new BehaviorSubject<GameMode>(0);
    public preloader = new Subject();

    public globalSettings = new BehaviorSubject<any>(Object.assign(globalSettings, {lastChanged: null}));

    constructor() {

    }

    public resetPlayerOptions() {
        this.playerOptions.next(new InitState());
    }

    public setSettings(state) {
        localStorage.setItem('globalSettings', JSON.stringify(state) as any);
        this.globalSettings.next(state);
    }

}

export default new GlobalService();