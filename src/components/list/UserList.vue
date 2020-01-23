<template>
      <div class="sidebar">
        <div class="sidebar__users">
          <span class="title">Players: <b>{{users.length}}</b></span>
          <span class="sidebar__left-count">Left: {{cubes}}</span>  
          <ul>
              <li v-for="user of users" :key="user.id" :class="{'current-player' : isCurrent(user)}">
                  <div><i :style="{background: user.color}"></i>{{user.playerName}}</div>
                  <span>HP: {{user.health}} Kills: {{user.kills}} Deaths: {{user.death}}</span>
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
        cubes: []
    };
  },
  computed: {

  },
  mounted() {
    let self = this;

    GlobalService.users.subscribe(users=> {
        this.users = users;
    })

    GlobalService.cubes.subscribe(cubes=>{
        this.cubes = cubes;
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