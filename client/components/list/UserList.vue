<template>
      <div class="user-list">
        <div class="user-list__users">
           <div class="user-list__left-count">Online: <b>{{users.length}}</b></div> 
           <!--<span class="user-list__left-count">Runes: {{runes}}</span>  -->
          <ul>
              <li v-for="user of users" :key="user.id" :class="{'current-player' : isCurrent(user)}">
                  <div><i :style="{background: user.color}"></i>{{user.playerName}}</div>
                  <span>HP: {{user.health}} K - {{user.kills}} D - {{user.death}}</span>
              </li>
          </ul>
        </div>
      </div>
</template>

<script>

import GlobalService from '../../services/global.service'

export default {
  components: {},
  data: () => {
    return {
        users: [],
        runes: []
    };
  },
  computed: {

  },
  mounted() {
    let self = this;

    GlobalService.users.subscribe(users=> {
        this.users = users;
    })

    GlobalService.runes.subscribe(runes=>{
        this.runes = runes;
    })
  },
  methods: {
    isCurrent(user) {
      return GlobalService.user.value && GlobalService.user.value.id === user.id;
    }
  }
};
</script>

<style lang="less">

  .user-list {
    float: right;
    width: 400px;
    padding: 5px;
    z-index: 10;
    position: fixed;
    right: -400px;
    // border: 1px solid #999;
    // background: #fff;
    transition: 0.2s;
    &.active {
      right: 0px;
    }

    // background: rgba(245, 245, 245, 0.8);
    #welcome {
      font-size: 12px;
    }
    &__left-count {
      width: 100%;
      float: left;
      font-size: 20px;
      color: #fff;
      text-align: right;
    }
    &__users {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      .title {
        margin: 10px 0;
        display: inline-block;
        font-size: 18px;
        text-transform: uppercase;
      }
      ul {
        width: 100%;
        max-height: 200px;
        overflow: auto;
        margin-top: 20px;
        li {
          // background: #eee;
          padding: 3px 10px 3px 0;
          // border: 1px solid #999;
          border-bottom: none;
          font-size: 14px;
          position: relative;
          height: 21px;
          display: flex;
          align-items: center;
          justify-content: space-between;
            color: #fff;
              border-bottom: 1px solid #999;  
          &.current-player {
            // background: rgba(17, 17, 17, 0.575);
            font-weight: 700;
          
          }
          i {
            position: absolute;
            left: 7px;
            top: 0;
            border-radius: 100%;
            width: 8px;
            height: 8px;
            display: block;
            bottom: 0;
            margin: auto;
          }

          &:last-child {
          
          }
        }
      }
    }
  }
</style>