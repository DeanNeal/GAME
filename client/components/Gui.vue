<template>
  <div class="gui" v-if="inGame">
    <app-user-list></app-user-list>
    <div class="speed">{{speed}}</div>
    <div class="preloader" v-if="preloader">
      <div class="spinner"></div>
      <div class="preloader__text">Loading...</div>
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
      preloader: false,
      inMenu: false,
      inGame: false,
      timeout: null,
      speed: 0
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
      GlobalService.inMenu.next(true)
      GlobalService.currentPage.next('mainMenu')
      GlobalService.gameInstance.getValue().removeListeners()
      AudioService.playAudio('menuMusic', 0.2, true)

      GlobalService.gameInstance.getValue().worker.post({ type: 'stopFire' })
      GlobalService.gameInstance.getValue().worker.post({ type: 'inMenu', value: true })
      
    },
    backToGame () {
      GlobalService.inMenu.next(false)
      GlobalService.gameInstance.getValue().addListeners()
      AudioService.stopAudio('menuMusic')

      GlobalService.gameInstance.getValue().worker.post({ type: 'inMenu', value: false })
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
  flex-wrap: wrap;
  display: flex;
  align-content: center;
  justify-content: center;
  left: 0;
  top: 0;
  z-index: 100;
  background: #000;
  font-size: 32px;
  &__text {
    width: 100%;
    text-align: center;
  }
}
.speed {
  font-size: 52px;
  color: #fff;
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  text-align:center;
}
</style>
