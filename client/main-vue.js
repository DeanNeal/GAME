import Vue from 'vue'
import App from './components/App.vue'
import './less/main.less'; 
import './polyfills';

import Back from './components/Back.vue';

Vue.component('app-back', Back)

new Vue({
  el: '#app',
  render: h => h(App)
})