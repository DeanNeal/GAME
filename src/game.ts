import Helpers from './helper';

import GlobalService from './services/global.service';
import AudioService from './services/audio.service';

declare var window: any;
declare var document: any;

import createWorker from './vendor/create-worker';

interface IOptions {
    name: string;
    color: string;
}

export class Game {
    public container: HTMLCanvasElement;
    public worker: {worker: Worker, post(o): any  };
    public speedBlock: HTMLElement;
 
    constructor(opts: IOptions) {
        this.init(opts);

        this.onWindowResize = this.onWindowResize.bind(this);

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);

        this.onContextmenu =  this.onContextmenu.bind(this);
        this.onMouseWheel = this.onMouseWheel.bind(this);
    }

    init(opts: IOptions) {
        this.container = document.createElement('canvas');
        document.body.appendChild(this.container);

        this.worker = createWorker(this.container, './worker.js', (e: any)=> {

            this.speedBlock = document.querySelector('#gui-speed-value');
            
            if(e.data.type === 'startTimer') {
                this.startTimer();
            }
            if(e.data.type === 'updateRunes') {
                GlobalService.runes.next(e.data.runes)
            }
            if(e.data.type === 'playShot') {
                AudioService.playAudio('blaster', e.data.volume);
            }
            if(e.data.type === 'readyForListeners') {
                this.addListeners();
            }
            if(e.data.type==='speed' && this.speedBlock){
                this.speedBlock.innerHTML = e.data.speed.moveMult;
            }

            if(e.data.type === 'userUpdated') {
                GlobalService.user.next(e.data.user);
                if(e.data.damage) {
                    GlobalService.damage.next();
                }
            }

            if(e.data.type === 'userList') {
                GlobalService.users.next(e.data.users);
            }

            if(e.data.type === 'damageDone') {
                AudioService.playAudio('damage', e.data.volume, true);
            }

            if(e.data.type === 'removeRune') {
                AudioService.playAudio('rune', e.data.volume, true);
            }

       
        });
        
        this.worker.post({type: 'connection', playerOptions: opts})

        this.onWindowResize();
    }

    startTimer() {
        let fiveMinutes = 5,
            display = document.querySelector('#timer');
        Helpers.startTimer(fiveMinutes, display);
    }

    onWindowResize() {
        this.worker.post({
             type: 'resize', width: window.innerWidth, height: window.innerHeight
        });
    }

    addListeners() {
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

    onMouseDown(e: MouseEvent) {
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

    onMouseMove(e: MouseEvent) {
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

    onMouseUp(e: MouseEvent) {
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

    onKeyDown(e: KeyboardEvent) {
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

    onKeyPress(e: KeyboardEvent) {
        this.worker.post({
            type: 'keypress',
            mouse: {
                altKey: e.altKey,
                keyCode: e.keyCode,
            }
        })
    }

    onKeyUp(e: KeyboardEvent) {
        this.worker.post({
            type: 'keyup',
            mouse: {
                altKey: e.altKey,
                keyCode: e.keyCode,
            }
        })
    }

    onContextmenu(e: MouseEvent) {
        e.preventDefault();
    }

    onMouseWheel(e: MouseWheelEvent) {
        e = window.event || e;
        // const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

        this.worker.post({
            type: 'mousewheel',
            mouse: {
                // wheelDelta: e.wheelDelta,
                deltaY: e.deltaY
            }
        })

        // e.preventDefault();
    }

    removeListeners() {
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

    disconnect() {
        this.removeListeners();
        this.worker.worker.terminate();
        this.worker = undefined;
        this.container.remove();
    }
 
}
