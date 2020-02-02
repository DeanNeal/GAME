<template>
  <div class="page settings">
    <app-back></app-back>

    <div class="section">
      <h2>Video</h2>
      <ul>
        <li v-if="!inGame">
          <label class="checkbox">
            <span> anti-aliasing: </span>
            <input
              type="checkbox"
              @change="onChange($event, 'antialiasing')"
              :checked="state.antialiasing"
            />
          </label>
        </li>
      </ul>
    </div>
    <div class="section">
      <h2>Audio</h2>
      <ul>
        <li>
          <label class="checkbox">
            <span>Sounds: </span>
            <input
              type="checkbox"
              @change="onChange($event, 'sounds')"
              :checked="state.sounds"
            />
          </label>
        </li>

        <li>
          <label class="checkbox">
            <span>Music: </span>
            <input
              type="checkbox"
              @change="onChange($event, 'music')"
              :checked="state.music"
            />
          </label>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import GlobalService from '../../services/global.service'
import AudioService from '../../services/audio.service'

export default {
  data: () => {
    return {
      inGame: false,
      state: {}
    }
  },
  mounted () {
    GlobalService.inGame.subscribe(state => {
      this.inGame = state
    })
    GlobalService.globalSettings.subscribe(state => {
      this.state = state
    })
  },
  methods: {
    back () {
      GlobalService.currentPage.next('mainMenu')
    },
    onChange (e, name) {
      this.state[name] = e.target.checked
      this.state.lastChanged = name
      GlobalService.setSettings(this.state)
    }
  }
}
</script>

<style lang="less">
.settings {
  h2 {
    color: #fff;
  }
  ul {
    margin-top: 10px;
    li {
      color: #fff;
      padding-left: 10px;
      &+ li {
        margin: 10px 0 0 0;
      }
    }
  }

  .section {
      margin-top: 60px;
      & + .section {
        margin-top: 30px;
      }
  }
}
</style>
