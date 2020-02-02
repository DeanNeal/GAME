<template>
  <div class="container absolute">
    <!--:class="[isReady ? (viewMode === 1 ? 'mode-0' : 'mode-1') : '']"
  >-->
    <div class="start-page" v-if="inMenu">
      <div class="overlay"></div>
      <app-main v-if="currentPage === 'mainMenu'"></app-main>
      <app-settings v-if="currentPage === 'settings'"></app-settings>
      <app-credits v-if="currentPage === 'credits'"></app-credits>
      <app-new-game v-if="currentPage === 'newGame'"></app-new-game>
    </div>

    <app-gui></app-gui>
  </div>
</template>

<script>
import GlobalService from '../services/global.service'
import AudioService from '../services/audio.service'

import SettingsPage from './pages/Settings.vue'
import CreditsPage from './pages/Credits.vue'
import NewGamePage from './pages/NewGame.vue'
import MainPage from './pages/Main.vue'
import Gui from './Gui.vue'

export default {
  name: 'App',
  components: {
    'app-main': MainPage,
    'app-settings': SettingsPage,
    'app-credits': CreditsPage,
    'app-new-game': NewGamePage,
    'app-gui': Gui
  },
  data: () => {
    return {
      //   showTab: true,
      viewMode: 0,
      currentPage: null,
      inMenu: true
    }
  },
  mounted () {
    GlobalService.currentPage.subscribe(page => {
      this.currentPage = page
    })

    GlobalService.inMenu.subscribe(state => {
      this.inMenu = state
    })

    GlobalService.globalSettings.subscribe(state => {
      if (!state.lastChanged || state.lastChanged === 'music') {
        if (state.music) {
          AudioService.playAudio('menuMusic', 0.2, true)
        } else {
          AudioService.stopAudio('menuMusic')
        }
      }
    })

    // GlobalService.viewMode.subscribe(mode => {
    //   // this.showTab = !this.showTab;
    //   this.viewMode = mode
    // })
  },
  methods: {}
}
</script>
