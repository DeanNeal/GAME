<template>
  <div class="container absolute">
    <div class="start-page" v-if="!getReady">
      <div class="overlay"></div>
      <div class="popup">
        <form class="popup__content" @submit="submit($event)">
          <label>Username</label>
          <input
            type="text"
            v-model="playerOptions.name"
            @keydown="keyPress($event)"
            required
          />
          <button class="btn" :disabled="getReady" type="submit">START</button>
        </form>
      </div>
    </div>

    <div class="controls" v-if="getReady">
      <div id="info">Controls - > WASD/RF/QE + mouse</div>
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
// import HelloWorld from './components/HelloWorld'
import { Game } from '../game'
import SocketService from '../socket.service'
// import UserService from '../user.service';
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
      playerOptions: {
        name: ''
      },
      user: {
        health: 100
      }
    }
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
    }
  }
}
</script>

<style></style>
