import Vue from 'vue'
import VueVirtualScroller from 'vue-virtual-scroller'
import App from './App.vue'
import router from './router'
import store from './store'

// Vue Virtual Scroller
Vue.use(VueVirtualScroller)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app')
