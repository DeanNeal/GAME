<template>
  <div class="container absolute">
    <div class="start-page" v-if="!getReady">
      <div class="overlay"></div>
      <div class="popup">
        <form class="popup__content" @submit="submit($event)">
          <label>Username</label>
          <input
            ref="input"
            type="text"
            placeholder="username"
            maxlength="20"
            v-model="playerOptions.name"
            @keydown="keyPress($event)"
            required
          />
          <div class="colors">
              <div @click="playerOptions.color = color" 
                :style="{background: color}"
                class="color" :class="{active: playerOptions.color === color}" 
                v-for="color of colors">
              </div>
          </div>
          <button class="btn" :disabled="getReady" type="submit">START</button>
        </form>
      </div>
    </div>

    <div class="controls" v-if="getReady">
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
import SocketService from '../socket.service'
import GlobalService from '../global.service'

import UserList from './list/UserList.vue'

export default {
  name: 'App',
  components: {
    'app-user-list': UserList
  },
  data: () => {
    return {
      getReady: false,
      colors: ['red', 'yellow', 'green', 'blue'],
      playerOptions: {
        name: '',
        color: 'red'
      },
      user: {
        health: null
      }
    }
  },
  mounted () {
    this.$refs.input.focus()

    // GlobalService.gameOver.subscribe(() => {
    //   this.getReady = false
    // })

    GlobalService.user
      .filter(r => r)
      .subscribe(user => {
        this.user = user
      })

    GlobalService.damage.subscribe(() => {
      clearTimeout(this.timeout)
      var c = document.querySelector('.controls')
      c.classList.add('damage')

      var audio = new Audio('sounds/damage.mp3')
      audio.volume = 0.5
      audio.play()

      this.timeout = setTimeout(() => {
        c.classList.remove('damage')
      }, 300)
    })
  },
  methods: {
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

      let game = new Game(this.playerOptions)
    }
  }
}
</script>

<style>

</style>
