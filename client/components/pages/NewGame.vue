<template>
  <div class="page new-game">
    <app-back></app-back>
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
      <button class="btn" type="submit">START</button>
    </form>
  </div>
</template>

<script>
import { Game } from '../../game'
import GlobalService from '../../services/global.service'
import AudioService from '../../services/audio.service'

export default {
  data: () => {
    return {
      playerOptions: {}
    }
  },
  mounted () {
    this.$refs.input.focus()

    GlobalService.playerOptions.subscribe(opts => {
      this.playerOptions = opts
    })
  },
  methods: {
    submit (e) {
      e.preventDefault()
      this.start()
    },
    start () {
      GlobalService.inMenu.next(false)
      GlobalService.inGame.next(true)
      AudioService.stopAudio('menuMusic')

      GlobalService.gameInstance.next(new Game(this.playerOptions))
    },
    keyPress (event) {
      if (event.key == 'Enter' && this.playerOptions.name) {
        this.start()
      }
    }
  }
}
</script>
