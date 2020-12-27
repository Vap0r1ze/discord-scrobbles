<template>
  <div id="app">
    <router-view v-if="isAppReady()" id="app-view"/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { spotify } from './api'

@Component({ name: 'App' })
export default class App extends Vue {
  spotifyApiReady = false

  isAppReady() {
    return this.spotifyApiReady
  }

  created() {
    if (spotify.isAuthenticated) {
      this.spotifyApiReady = true
    } else {
      spotify.on('tokenUpdate', () => {
        if (spotify.isAuthenticated) this.spotifyApiReady = true
        else this.spotifyApiReady = false
      })
    }
    setInterval(() => {
      this.$store.dispatch('updateNow')
    }, 1000)
  }
}
</script>

<style lang="scss">
@import './assets/fonts.scss';
@import url('https://fonts.googleapis.com/css?family=Open+Sans:400,600&display=swap');

html, body {
  padding: 0;
  margin: 0;
}

#app {
  height: 100vh;
  overflow: hidden;
  width: 100vw;
}
#app-view {
  height: 100%;
  overflow-x: hidden;
  width: 100%;
}

div,
input {
  box-sizing: border-box;
}
#app,
input,
button {
  font-family: 'Open Sans', Arial, Helvetica, sans-serif;
}

.scroller {
  &::-webkit-scrollbar {
    width: 10px;
  }
  &::-webkit-scrollbar-track {
    background: #404040;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.5);
    border: 3px solid #404040;
    border-radius: 999px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.7);
  }
}
</style>
