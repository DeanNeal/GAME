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
      <label>Location: Earth</label>
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
      AudioService.stopAudio('menuMusic', true)

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

<style lang="less">
.new-game {
  z-index: 1000;
  position: fixed;
  // background: #fff;
  border-radius: 5px;
  // box-shadow: 0 0 8px 2px #000;
  min-height: 115px;
  // cursor: auto;
  // box-shadow: 0 0 30px 0px #555;
  color: #fff;
  &__content {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
  }
  .btn {
    // cursor: url(../../public/images/cursor1.png), pointer;
    // cursor: pointer;
    width: 100%;
    margin: 0px 50px;
    padding: 15px 20px;
    // height: 30px;
    margin-top: 70px;
    margin-bottom: 10px;
    background: none;
    color: #fff;
    font-size: 20px;
    border-radius: 4px;
    outline: none;
  }
  label {
    width: 100%;
    text-align: left;
    font-size: 18px;
    margin-top: 40px;
    & + label {
      margin-top: 25px;
    }
    // margin-bottom: 15px;
    // cursor: url(../../public/images/ cursor1.png), pointer;
  }
  input {
    width: 100%;
    // border-radius: 4px;
    height: 30px;
    margin-top: 40px;
    border: none;
    border-bottom: 1px solid #ccc;
    padding: 7px 0px;
    outline: none;
    background: none;
    color: #fff;
    font-size: 20px;
  }
  select {
    margin-right: 22px;
    padding: 4px 9px 6px 9px;
  }
  .colors {
    width: 100%;
    float: left;
    display: flex;
    justify-content: space-between;
    label {
      float: left;
      margin-right: 4px;
      margin-bottom: 10px;
    }
    .color {
      transition: 0.2s;
      // cursor: pointer;
      width: 30px;
      height: 30px;
      display: inline-block;
      // border: 1px solid #ccc;
      margin-right: 5px;
    }
    .color.active {
      box-shadow: 0 0 0px 2px #fff;
      border-color: #494949;
    }
  }
}
</style>
