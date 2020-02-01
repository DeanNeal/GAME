<template>
  <div class="gui" v-if="inGame" :class="{ damage: damage }">
    <!--<div class="gui__info">
        <div>Controls - > WA/QE + mouse</div>
        <div>Shift - constant speed</div>
        <div>Tab - change view mode</div>
      </div> -->
    <div class="gui__hp">HP {{ user.health }}</div>
    <div class="gui__right">
      <div class="gui__speed">{{ gui.speed }} KM/H</div>
      <div class="gui__redzone">ZONE: {{ gui.zoneProcentage }}</div>
    </div>
    <!--<div class="gui__timer"></div>-->
    <div class="gui__damage"></div>
    <app-user-list></app-user-list>

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
      gui: {},
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

    GlobalService.gui.subscribe(gui => {
      this.gui = gui
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
.gui {
  &.damage {
    .gui__damage {
      display: block;
    }
  }
  &__damage {
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    background: rgba(255, 0, 0, 0.3);
    width: 100%;
    height: 100%;
  }

  &__hp {
    position: absolute;
    width: 200px;
    text-align: left;
    font-size: 48px;
    color: #fff;
    text-align: center;
    bottom: 40px;
    left: 10px;
    margin: auto;
    height: 50px;
    white-space: nowrap;
  }

  &__right {
    position: absolute;
    // width: 250px;
    text-align: right;
    font-size: 48px;
    color: #fff;
    text-align: right;
    bottom: 40px;
    right: 10px;
    margin: auto;
    // height: 50px;
    // white-space: nowrap;
    flex-wrap: wrap;
    display: flex;
  }

  &__speed {
    width: 100%;
  }

  &__redzone {
    width: 100%;
  }

  &__info {
    position: absolute;
    top: 10px;
    width: 100%;
    color: #fff;
    padding: 5px;
    font-size: 13px;
    text-align: center;
    z-index: 1;
  }
  
  &__timer {
    position: absolute;
    width: 200px;
    font-size: 180px;
    color: #fff;
    text-align: center;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    margin: auto;
    height: 200px;
  }
}

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
</style>
