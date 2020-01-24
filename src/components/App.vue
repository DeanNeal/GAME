<template>
  <div class="container absolute">
    <div class="start-page" v-if="!getReady">
      <!--<div class="overlay"></div>-->

      <div class="page main-menu" v-if="currentPage === 'mainMenu'">
        <h1>SPACE GAME <sup>alpha</sup></h1>

        <span>Online: {{ online }}</span>
        <ul>
          <li @click="goTo('newGame')" @mouseenter="menuItemMouse()"><span>New game</span></li>
          <!--<li>Settings</li>-->
          <!--<li @click="exit()" href="javascript:close_window();">Exit</li>-->
          <li @click="goTo('credits')" @mouseenter="menuItemMouse()"><span>Credits</span></li>
        </ul>
      </div>

      <div class="page authors" v-if="currentPage === 'credits'">
          <span @click="back()" class="back">BACK</span>
          <ul>
            <li>venomsunset</li>
            <li>mobix</li>
          </ul>
      </div>

      <div class="page new-game" v-if="currentPage === 'newGame'">
        <span @click="back()" class="back">BACK</span>
        <form class="new-game__content" @submit="submit($event)">
       
          <input
            ref="input"
            type="text"
            placeholder="username"
            maxlength="20"
            v-model="playerOptions.name"
            @keydown="keyPress($event)"
            required
          />
          <label>Ship color</label>
          <div class="colors">
            <div
              @click="playerOptions.color = color"
              :style="{ background: color }"
              class="color"
              :class="{ active: playerOptions.color === color }"
              v-for="color of colors"
            ></div>
          </div>
          <button class="btn" :disabled="getReady" type="submit">START</button>
        </form>
      </div>
    </div>

    <div class="controls" v-if="getReady">
      <div id="backToMain" @click="back()">Back to main menu</div>
      <div id="info">Controls - > WA/QE + mouse & shift(freeze)</div>
      <div id="position"></div>
      <div id="rotation"></div>
      <div id="gui">HP {{ user.health }}</div>
      <div id="gui-speed"><span id="gui-speed-value"></span> KM/H</div>
      <div id="timer"></div>
      <div class="damage"></div>
      <app-user-list></app-user-list>
    </div>
  </div>
</template>

<script>
import { Game } from '../game'
import SocketService from '../worker/socket.service'
import GlobalService from '../global.service'

import UserList from './list/UserList.vue'

import {adjustVolume} from './audio';


class InitState {
  constructor() {
    this.name = '';
    this.color = 'red';
  }
}

export default {
  name: 'App',
  components: {
    'app-user-list': UserList
  },
  data: () => {
    return {
      gameInstance: null,
      introMusic: null,
      currentPage: 'mainMenu',
      getReady: false,
      online: 0,
      colors: ['red', 'yellow', 'lime', 'blue'],
      playerOptions: new InitState(),
      menuItemSound: new Audio('sounds/menu.mp3'),
      user: {
        health: null
      }
    }
  },
  mounted () {

    //

    // GlobalService.gameOver.subscribe(() => {
    //   this.getReady = false
    // })

    this.playIntro();


    SocketService.socket.on('online', online => {
      this.online = online
    })

    GlobalService.user
      .filter(r => r)
      .subscribe(user => {
        this.user = user
      })

    GlobalService.damage.subscribe(() => {
      clearTimeout(this.timeout)
      var c = document.querySelector('.controls')
      c.classList.add('damage')

      this.timeout = setTimeout(() => {
        c.classList.remove('damage')
      }, 300)
    })
  },
  methods: {
    playIntro() {
      this.introMusic = new Audio('sounds/fine.mp3')
      this.introMusic.volume = 0.2
      this.introMusic.autoplay = true
      this.introMusic.play()
    },
    menuItemMouse() {
      this.menuItemSound.pause()
      this.menuItemSound.currentTime = 0;
      this.menuItemSound.volume = 0.2
      this.menuItemSound.play()
    },
    exit () {
      if (confirm('Close Window?')) {
        close()
      }
    },
    goTo(page){
      this.currentPage = page;
    },
    back () {
      this.goTo('mainMenu');
      
      if(this.gameInstance) {
          this.getReady = false
          this.gameInstance.disconnect();
          this.gameInstance = undefined;
          this.playerOptions = new InitState();
          this.playIntro();
      }
    },
    newGame () {
      this.currentPage = 'newGame'
      setTimeout(() => {
        this.$refs.input.focus()
      })
    },
    submit (e) {
      e.preventDefault()
      this.start()
    },
    keyPress (event) {
      if (event.key == 'Enter' && this.playerOptions.name) {
        this.start()
      }
    },
    start () {
      this.getReady = true
      adjustVolume(this.introMusic, 0);


      this.gameInstance = new Game(this.playerOptions)
    }
  }
}
</script>

<style></style>
