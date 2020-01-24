import './polyfills';
import Helpers from './helper';

import GlobalService from './global.service';

declare var window: any;
declare var document: any;

import createWorker from './vendor/create-worker';

export class Game {
    public container: any;
    public worker: any;
    public speedBlock:any;
 
    constructor(opts: any) {
        this.init(opts);

        this.onWindowResize = this.onWindowResize.bind(this);

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);

        this.onContextmenu =  this.onContextmenu.bind(this);
    }

    init(opts: any) {
        this.container = document.createElement('canvas');
        document.body.appendChild(this.container);

        this.worker = createWorker(this.container, './worker.js', (e: any)=> {

            this.speedBlock = document.querySelector('#gui-speed-value');
            
            if(e.data.type === 'startTimer') {
                this.startTimer();
            }
            if(e.data.type === 'updateCubes') {
                GlobalService.cubes.next(e.data.cubes)
            }
            if(e.data.type === 'playShot') {
                var audio = new Audio('sounds/blaster-1.mp3')
                audio.volume = e.data.volume || 0.1
                audio.play()
            }
            if(e.data.type === 'readyForListeners') {
                this.addListeners();
            }
            if(e.data.type==='speed'){
                this.speedBlock.innerHTML = e.data.speed.moveMult;
            }

            if(e.data.type === 'userUpdated') {
                GlobalService.user.next(e.data.user);
                if(e.data.damage) {
                    GlobalService.damage.next();
                }
            }

            if(e.data.type === 'damageDone') {
                var audio = new Audio('sounds/damage.mp3')
                audio.volume = e.data.volume || 0.3
                audio.play()
            }

            if(e.data.type === 'userList') {
                GlobalService.users.next(e.data.users);
            }

            // if(e.data.type === 'gameOver') {
            //     GlobalService.gameOver.next();
            // }
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
    }

    onMouseDown(e) {
        e.preventDefault();
        e.stopPropagation();
        this.worker.post({
            type: 'mousedown',
            mouse: {
                button: e.button
            }
        })
    }

    onMouseMove(e) {
        e.preventDefault();
        e.stopPropagation();
        this.worker.post({
            type: 'mousemove',
            mouse: {
                pageX: e.pageX,
                pageY: e.pageY
            }
        })
    }

    onMouseUp(e) {
        e.preventDefault();
        e.stopPropagation();
        this.worker.post({
            type: 'mouseup',
            mouse: {
                pageX: e.pageX,
                pageY: e.pageY
            }
        })
    }

    onKeyDown(e) {
        if(e.keyCode === 32) {
            this.worker.post({
                type: 'startFire'
            });
        }

        this.worker.post({
            type: 'keydown',
            mouse: {
                altKey: e.altKey,
                keyCode: e.keyCode,
            }
        })
    }

    onKeyPress(e) {
        this.worker.post({
            type: 'keypress',
            mouse: {
                altKey: e.altKey,
                keyCode: e.keyCode,
            }
        })
    }

    onKeyUp(e) {

        this.worker.post({
            type: 'stopFire'
        });
        
        this.worker.post({
            type: 'keyup',
            mouse: {
                altKey: e.altKey,
                keyCode: e.keyCode,
            }
        })
    }

    onContextmenu(e) {
        e.preventDefault();
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
    }

    disconnect() {
        this.removeListeners();
        this.worker.worker.terminate();
        this.worker = undefined;
        this.container.remove();
    }
 
}
