<template>
  <div  v-if="inGame">
    <div class="gui" :class="{ damage: damage }">
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
      <app-user-list></app-user-list>
    </div>

    <div class="preloader" v-if="preloader">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script>
import UserList from './list/UserList.vue'
import GlobalService from '../services/global.service'
import AudioService from '../services/audio.service'

export default {
  components: {
    'app-user-list': UserList
  },
  data: () => {
    return {
      speed: 0,
      damage: false,
      preloader: false,
      inMenu: false,
      inGame: false,
      timeout: null,
      user: {
        health: null
      }
    }
  },
  mounted () {
    GlobalService.user
      .filter(r => r)
      .subscribe(user => {
        this.user = user
      })

    GlobalService.inGame.subscribe(state => {
      this.inGame = state
    })
    
    GlobalService.inMenu.subscribe(state => {
      this.inMenu = state
    })

    GlobalService.preloader.subscribe(state => {
      this.preloader = state
    })

    GlobalService.speed.subscribe(speed => {
      this.speed = speed
    })

    GlobalService.damage.subscribe(() => {
      clearTimeout(this.timeout)
      this.damage = true

      this.timeout = setTimeout(() => {
        this.damage = false
      }, 300)
    })

    window.addEventListener(
      'keydown',
      e => {
        //esc
        if (this.inGame) {
          if (e.keyCode === 27) {
            this.inMenu ? this.backToGame() : this.goToMenu()
          }
        }
      },
      false
    )

    window.addEventListener(
      'resize',
      () => {
        if (GlobalService.gameInstance.getValue()) {
          GlobalService.gameInstance.getValue().onWindowResize()
        }
      },
      false
    )
  },
  methods: {
    goToMenu () {
      GlobalService.gameInstance.getValue().worker.post({ type: 'stopFire' })

      GlobalService.inMenu.next(true)
      GlobalService.currentPage.next('mainMenu')
      GlobalService.gameInstance.getValue().removeListeners()
      AudioService.playAudio('menuMusic', 0.2, true)
    },
    backToGame () {
      GlobalService.inMenu.next(false)
      GlobalService.gameInstance.getValue().addListeners()
      AudioService.stopAudio('menuMusic')
    }
  }
}
</script>

<style lang="less">
.preloader {
  position: fixed;
  width: 100%;
  height: 100%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  left: 0;
  top: 0;
  z-index: 100;
  background: #000;
  font-size: 32px;
}
</style>
