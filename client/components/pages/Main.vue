<template>
  <div class="page main-menu">
    <h1>SPACE GAME <sup>alpha</sup></h1>

    <span>Online: {{ online }}</span>

    <ul>
      <li v-if="!inGame" @click="goTo('newGame')" @mouseenter="menuItemMouse()">
        <span>New game</span>
      </li>
      <li v-if="inGame" @click="leavematch()" @mouseenter="menuItemMouse()">
        Leave match
      </li>

      <li @click="goTo('settings')" @mouseenter="menuItemMouse()">
        <span>Settings</span>
      </li>
      <li @click="goTo('credits')" @mouseenter="menuItemMouse()">
        <span>Credits</span>
      </li>
    </ul>

  </div>
</template>

<script>
import GlobalService from '../../services/global.service'
import AudioService from '../../services/audio.service'
import SocketService from '../../services/socket.service'

export default {
  data: () => {
    return {
      inGame: false,
      online: 0
    }
  },
  mounted () {
    SocketService.socket.on('online', online => {
      this.online = online
    })

    GlobalService.inGame.subscribe(state => {
      this.inGame = state
    })
  },
  methods: {
    menuItemMouse () {
      AudioService.playAudio('menuSelect')
    },
    goTo (page) {
      GlobalService.currentPage.next(page)
    },
    leavematch () {
      if (GlobalService.gameInstance.getValue()) {
        GlobalService.inGame.next(false)
        GlobalService.gameInstance.getValue().disconnect()
        GlobalService.gameInstance.next(null)
        GlobalService.resetPlayerOptions();
        AudioService.playAudio('menuMusic', null, false, true)
        this.goTo('mainMenu')
      }
    }
  }
}
</script>
