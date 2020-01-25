<template>
      <div class="sidebar">
        <div class="sidebar__users">
         <!-- <span class="title">Online: <b>{{users.length}}</b></span> -->
          <span class="sidebar__left-count">Runes: {{runes}}</span>  
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

import GlobalService from '../../global.service';

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

<style>
</style>