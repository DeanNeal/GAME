<template>
      <div class="sidebar">
        <div class="sidebar__users">
          <span class="title">Players:</span>
          <span class="sidebar__left-count">Left: {{cubes.length}}</span>  
          <ul>
              <li v-for="user of users" :key="user.id" :class="{'current-player' : isCurrent(user)}">
                  {{user.playerName}} - {{user.id}}
                  <span>Health: {{user.health}} Scores: {{user.scores}} Death: {{user.death}}</span>
              </li>
          </ul>
        </div>
      </div>
</template>

<script>
import SocketService from '../../socket.service';
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