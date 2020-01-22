import './polyfills';
import Helpers from './helper';

import GlobalService from './global.service';

declare var window: any;
declare var document: any;
declare var $: any;

import createWorker from './vendor/create-worker';


import { Observable, Subject, ReplaySubject, BehaviorSubject, from, of, range } from 'rxjs';

export class Game {
    public container: any;
    public worker: any;
    public speedBlock:any;


    constructor(opts: any) {
        this.init(opts);
    }

    init(opts: any) {
        this.container = document.createElement('canvas');
        // this.container.className = 'canvas';
        document.body.appendChild(this.container);

        this.worker = createWorker(this.container, './public/worker.js', (e: any)=> {

            this.speedBlock = document.querySelector('#gui-speed-value');
            
            if(e.data.type === 'startTimer') {
                this.startTimer();
            }
            if(e.data.type === 'updateCubes') {
                GlobalService.cubes.next(e.data.cubes)
            }
            if(e.data.type === 'playShot') {
                var audio = new Audio('public/blaster-1.mp3')
                audio.volume = 0.01
                audio.play()
            }
            if(e.data.type === 'readyForListeners') {
                this.addListeners();
            }
            if(e.data.type==='speed'){
                this.speedBlock.innerHTML = e.data.speed.moveMult;
            }
        });
        
        this.worker.post({type: 'connection', playerOptions: opts})

        Observable
        .fromEvent(document, 'keydown')
        .subscribe((e: KeyboardEvent) => {
            if(e.keyCode === 32) {
                this.worker.post({
                    type: 'startFire'
                });
            }
        })

        Observable
            .fromEvent(document, 'keyup')
            .subscribe((e: KeyboardEvent) => {
                this.worker.post({
                    type: 'stopFire'
                });
            })

        this.onWindowResize();

        window.addEventListener('resize', this.onWindowResize.bind(this), false);


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

        window.addEventListener('mousedown',(e)=> {
            e.preventDefault();
			e.stopPropagation();
            this.worker.post({
                type: 'mousedown',
                mouse: {
                    button: e.button
                }
            })
        }, false);
        window.addEventListener('mousemove',(e)=> {
            e.preventDefault();
			e.stopPropagation();
            this.worker.post({
                type: 'mousemove',
                mouse: {
                    pageX: e.pageX,
                    pageY: e.pageY
                }
            })
        }, false);

        window.addEventListener('mouseup',(e)=> {
            e.preventDefault();
			e.stopPropagation();
            this.worker.post({
                type: 'mouseup',
                mouse: {
                    pageX: e.pageX,
                    pageY: e.pageY
                }
            })
        }, false);

        window.addEventListener('keydown',(e)=> {
            this.worker.post({
                type: 'keydown',
                mouse: {
                    altKey: e.altKey,
                    keyCode: e.keyCode,
                }
            })
        }, false);

        window.addEventListener('keyup',(e)=> {
            this.worker.post({
                type: 'keyup',
                mouse: {
                    altKey: e.altKey,
                    keyCode: e.keyCode,
                }
            })
        }, false);

        window.addEventListener('keypress',(e)=> {
            this.worker.post({
                type: 'keypress',
                mouse: {
                    altKey: e.altKey,
                    keyCode: e.keyCode,
                }
            })
        }, false);

        window.addEventListener('contextmenu',(e)=> {
            e.preventDefault();
        }, false);
    }

 
}
