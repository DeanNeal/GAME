import Helpers from './helper';
import GlobalService from './services/global.service';
import AudioService from './services/audio.service';

declare var window: any;
declare var document: any;

import createWorker from './worker/create-worker';
import { IWorker, IGameOptions } from './interfaces/interfaces';


export class Game {
    public container: HTMLCanvasElement;
    public worker: IWorker;
    public speedBlock: HTMLElement;
 
    constructor(opts: IGameOptions) {
        this.onWindowResize = this.onWindowResize.bind(this);

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);

        this.onContextmenu =  this.onContextmenu.bind(this);
        this.onMouseWheel = this.onMouseWheel.bind(this);

        this.init(opts);
    }

    private init(opts: IGameOptions): void {
        this.container = document.createElement('canvas');
        document.body.appendChild(this.container);

        this.worker = createWorker(this.container, './worker.js', (e: MessageEvent)=> {
            switch(e.data.type) {
                case 'startTimer':
                    this.startTimer();
                break;
                case 'updateRunes':
                    GlobalService.runes.next(e.data.runes)
                break;
                case 'playShot':
                    AudioService.playAudio('blaster', e.data.volume);
                break;
    
                case 'speed':
                    GlobalService.speed.next(e.data.speed.moveMult);
                break;
    
                case 'userCreated':
                    GlobalService.user.next(e.data.user);
                    if(e.data.damage) {
                        GlobalService.damage.next();
                    }
                break;

                case 'userList':
                    GlobalService.users.next(e.data.users);
                break;
    
                case 'damageDone':
                    AudioService.playAudio('damage', e.data.volume, true);
                break;

                case 'gotDamage':
                    GlobalService.user.next(e.data.user);
                    GlobalService.damage.next();
                    AudioService.playAudio('damage', e.data.volume, true);
                break;
    
                case 'removeRune':
                    AudioService.playAudio('rune', e.data.volume, true);
                break;
            }
        });
        
        this.worker.post({type: 'connection', playerOptions: opts})

        this.onWindowResize();

        this.addListeners();
    }

    private startTimer(): void {
        let fiveMinutes = 5,
            display = document.querySelector('.gui__timer');
        Helpers.startTimer(fiveMinutes, display);
    }

    private onWindowResize(): void {
        this.worker.post({
             type: 'resize', width: window.innerWidth, height: window.innerHeight
        });
    }

    private onMouseDown(e: MouseEvent): void {
        e.preventDefault();
        e.stopPropagation();

        if(e.button === 0){// && GlobalService.viewMode.getValue() === 0) {
            this.worker.post({
                type: 'startFire'
            });
        }

        this.worker.post({
            type: 'mousedown',
            mouse: {
                clientX: e.clientX,
                clientY: e.clientY,
                button: e.button
            }
        })
    }

    private onMouseMove(e: MouseEvent): void {
        e.preventDefault();
        e.stopPropagation();
        this.worker.post({
            type: 'mousemove',
            mouse: {
                pageX: e.pageX,
                pageY: e.pageY,
                clientX: e.clientX,
                clientY: e.clientY
            }
        })
    }

    private onMouseUp(e: MouseEvent): void {
        e.preventDefault();
        e.stopPropagation();

        this.worker.post({
            type: 'stopFire'
        });

        this.worker.post({
            type: 'mouseup',
            mouse: {
                pageX: e.pageX,
                pageY: e.pageY,
                clientX: e.clientX,
                clientY: e.clientY
            }
        })
    }

    private onKeyDown(e: KeyboardEvent): void {
        if(e.keyCode === 9) {
            e.preventDefault();
            this.worker.post({
                type: 'changeViewMode'
            });
            GlobalService.viewMode.next(GlobalService.viewMode.getValue() ? 0 : 1);
        }

        this.worker.post({
            type: 'keydown',
            mouse: {
                altKey: e.altKey,
                keyCode: e.keyCode,
            }
        })
    }

    private onKeyPress(e: KeyboardEvent): void {
        this.worker.post({
            type: 'keypress',
            mouse: {
                altKey: e.altKey,
                keyCode: e.keyCode,
            }
        })
    }

    private onKeyUp(e: KeyboardEvent): void{
        this.worker.post({
            type: 'keyup',
            mouse: {
                altKey: e.altKey,
                keyCode: e.keyCode,
            }
        })
    }

    private onContextmenu(e: MouseEvent): void {
        e.preventDefault();
    }

    private onMouseWheel(e): void {
        e = window.event || e;
        const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

        this.worker.post({
            type: 'mousewheel',
            mouse: {
                wheelDelta: e.wheelDelta,
                deltaY: e.deltaY
            }
        })

        // e.preventDefault();
    }

    public addListeners(): void {
        window.addEventListener('mousedown', this.onMouseDown, false);
        window.addEventListener('mousemove', this.onMouseMove, false);
        window.addEventListener('mouseup', this.onMouseUp, false);
        
        window.addEventListener('keydown', this.onKeyDown, false);
        window.addEventListener('keyup', this.onKeyUp, false);
        window.addEventListener('keypress', this.onKeyPress, false);

        window.addEventListener('contextmenu', this.onContextmenu, false);
        window.addEventListener('resize', this.onWindowResize, false);

        window.addEventListener("mousewheel", this.onMouseWheel);
		window.addEventListener("DOMMouseScroll", this.onMouseWheel);
    }

    public removeListeners(): void {
        window.removeEventListener('resize', this.onWindowResize, false);

        window.removeEventListener('mousedown', this.onMouseDown, false);
        window.removeEventListener('mousemove', this.onMouseMove, false);
        window.removeEventListener('mouseup', this.onMouseUp, false);
        
        window.removeEventListener('keydown', this.onKeyDown, false);
        window.removeEventListener('keyup', this.onKeyUp, false);
        window.removeEventListener('keypress', this.onKeyPress, false);

        window.removeEventListener('contextmenu', this.onContextmenu, false);

        window.addEventListener("mousewheel", this.onMouseWheel);
		window.addEventListener("DOMMouseScroll", this.onMouseWheel);
    }

    public disconnect(): void {
        this.removeListeners();
        this.worker.worker.terminate();
        this.worker = undefined;
        this.container.remove();
    }
 
}
