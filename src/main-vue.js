import Vue from 'vue'
import App from './components/App.vue'
import './less/main.less'; 
import './polyfills';

new Vue({
  el: '#app',
  render: h => h(App)
})