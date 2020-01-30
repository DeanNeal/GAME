<template>
  <div
    class="container absolute"
    :class="[getReady ? (viewMode === 1 ? 'mode-0' : 'mode-1') : '']"
  >
    <div class="start-page" v-if="!getReady">
      <div class="overlay"></div>

      <div class="page main-menu" v-if="currentPage === 'mainMenu'">
        <h1>SPACE GAME <sup>alpha</sup></h1>

        <span>Online: {{ online }}</span>

        <ul v-if="!inGame">
          <li @click="goTo('newGame')" @mouseenter="menuItemMouse()">
            <span>New game</span>
          </li>
          <li @click="goTo('credits')" @mouseenter="menuItemMouse()">
            <span>Credits</span>
          </li>
        </ul>

        <ul v-if="inGame">
          <li @click="leavematch()" @mouseenter="menuItemMouse()">
            Leave match
          </li>
          <!--<li @click="backToGame()">Back to game</li>-->
        </ul>

        <label class="mute">
          <span>Sounds: </span>
          <input
            type="checkbox"
            @change="onMuteSounds($event)"
            :checked="soundsEnabled"
          />
        </label>

        <label class="mute">
          <span>Music: </span>
          <input
            type="checkbox"
            @change="onMuteMusic($event)"
            :checked="musicEnabled"
          />
        </label>
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
          <label>Ship: default</label>

          <!--<div class="colors">
            <div
              @click="playerOptions.color = color"
              :style="{ background: color }"
              class="color"
              :class="{ active: playerOptions.color === color }"
              v-for="color of colors"
            ></div>
          </div>-->
          <button class="btn" :disabled="getReady" type="submit">START</button>
        </form>
      </div>
    </div>

    <div class="gui" v-if="inGame">
      <div class="gui__info">
        <div>Controls - > WA/QE + mouse</div>
        <div>Shift - constant speed</div>
        <div>Tab - change view mode</div>
      </div>
      <div class="gui__hp">HP {{ user.health }}</div>
      <div class="gui__speed">
        <span class="gui__speed-value">{{ speed }}</span> KM/H
      </div>
      <div class="gui__timer"></div>
      <div class="gui__damage"></div>
      <app-user-list :class="{ active: showTab }"></app-user-list>
    </div>
  </div>
</template>

<script>
import { Game } from '../game'
import SocketService from '../services/socket.service'
import GlobalService from '../services/global.service'
import AudioService from '../services/audio.service'

import UserList from './list/UserList.vue'

class InitState {
  constructor () {
    this.name = ''
    this.shipType = 'default'
  }
}

export default {
  name: 'App',
  components: {
    'app-user-list': UserList
  },
  data: () => {
    return {
      soundsEnabled: false,
      musicEnabled: false,
      showTab: true,
      viewMode: 0,
      gameInstance: null,
      introMusic: null,
      currentPage: 'mainMenu',
      getReady: false,
      inGame: false,
      online: 0,
      // colors: ['red'],// 'yellow', 'lime', 'blue'],
      playerOptions: new InitState(),
      user: {
        health: null
      },
      speed: 0
    }
  },
  mounted () {
    GlobalService.musicEnabled.subscribe(state => {
      this.musicEnabled = state
      if (state) {
        AudioService.playAudio('menuMusic', 0.2, true)
      } else {
        AudioService.stopAudio('menuMusic')
      }
    })

    GlobalService.soundsEnabled.subscribe(state => {
      this.soundsEnabled = state
    })

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
      var c = document.querySelector('.gui')
      c.classList.add('damage')

      this.timeout = setTimeout(() => {
        c.classList.remove('damage')
      }, 300)
    })

    GlobalService.viewMode.subscribe(mode => {
      // this.showTab = !this.showTab;
      this.viewMode = mode
    })

    GlobalService.speed.subscribe(speed => {
      this.speed = speed
    })

    window.addEventListener(
      'keydown',
      e => {
        //esc
        if (this.inGame) {
          if (e.keyCode === 27) {
            this.getReady ? this.goToMenu() : this.backToGame()
          }
        }
      },
      false
    )

    window.addEventListener(
      'resize',
      () => {
        if (this.gameInstance) {
          this.gameInstance.onWindowResize();
        }
      },
      false
    )
  },
  methods: {
    onMuteSounds (e) {
      GlobalService.setSoundsEnabled(e.target.checked)
    },
    onMuteMusic (e) {
      GlobalService.setMusicEnabled(e.target.checked)
    },

    menuItemMouse () {
      AudioService.playAudio('menuSelect')
    },

    goTo (page) {
      this.currentPage = page
      if (page === 'newGame') {
        setTimeout(() => {
          this.$refs.input.focus()
        })
      }
    },
    back () {
      this.goTo('mainMenu')
    },
    leavematch () {
      if (this.gameInstance) {
        this.getReady = false
        this.inGame = false
        this.gameInstance.disconnect()
        this.gameInstance = undefined
        this.playerOptions = new InitState()
        AudioService.playAudio('menuMusic', null, false, true)
        this.goTo('mainMenu')
      }
    },
    goToMenu () {
      this.gameInstance.worker.post({ type: 'stopFire' })

      this.goTo('mainMenu')
      this.getReady = false
      this.gameInstance.removeListeners()
      AudioService.playAudio('menuMusic', 0.2, true)
    },
    backToGame () {
      this.getReady = true
      this.gameInstance.addListeners()
      AudioService.stopAudio('menuMusic')
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
      this.inGame = true
      AudioService.stopAudio('menuMusic')

      this.gameInstance = new Game(this.playerOptions)
    }
  }
}
</script>

<style></style>
