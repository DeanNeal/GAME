<template>
  <div class="page settings">
    <app-back></app-back>

    <ul>
      <li>
        <label class="checkbox">
          <span> anti-aliasing: </span>
          <input
            type="checkbox"
            @change="onAnti($event)"
            :checked="antialiasing"
          />
        </label>
      </li>

      <li>
        <label class="checkbox">
          <span>Sounds: </span>
          <input
            type="checkbox"
            @change="onMuteSounds($event)"
            :checked="soundsEnabled"
          />
        </label>
      </li>

      <li>
        <label class="checkbox">
          <span>Music: </span>
          <input
            type="checkbox"
            @change="onMuteMusic($event)"
            :checked="musicEnabled"
          />
        </label>
      </li>
    </ul>
  </div>
</template>

<script>
import GlobalService from '../../services/global.service'
import AudioService from '../../services/audio.service'

export default {
  data: () => {
    return {
      antialiasing: false,
      soundsEnabled: false,
      musicEnabled: false
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
  },
  methods: {
    back () {
      GlobalService.currentPage.next('mainMenu')
    },
    onMuteSounds (e) {
      GlobalService.setSoundsEnabled(e.target.checked)
    },
    onMuteMusic (e) {
      GlobalService.setMusicEnabled(e.target.checked)
    },
    onAnti (e) {
      // GlobalService.setMusicEnabled(e.target.checked)
    }
  }
}
</script>

<style lang="less">
.settings {
  ul {
    margin: 70px 0 0 0;
    li {
      margin: 20px 0;
      color: #fff;
    }
  }
}
</style>
