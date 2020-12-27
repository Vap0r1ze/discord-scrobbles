import Vue from 'vue'
import Vuex from 'vuex'
import localforage from 'localforage'
import { Image, Track } from '@/types/Spotify'
import { User } from '@/types/ScrobbleClient'

Vue.use(Vuex)

export interface Cache<T> {
  [ id: string ]: T | undefined;
}
export interface StateTrack {
  id: string;
  album: string;
  artists: string[];
  name: string;
  duration: number;
}

/**
 * Apparently its possible for an album to not have a cover image lol
 * E.g: https://open.spotify.com/album/0fHB3Fl84QT2cjwDTEKXon (https://i.imgur.com/SEvnvpI.png)
 * */
export interface StateAlbum {
  id: string;
  name: string;
  images: Array<Image | undefined>;
}
export interface StateArtist {
  id: string;
  name: string;
}
export interface State {
  nowDate: number;
  tracks: Cache<StateTrack>;
  albums: Cache<StateAlbum>;
  artists: Cache<StateArtist>;
  users: Cache<User>;
  localforageEnabled: boolean;
}

export default new Vuex.Store<State>({
  state: {
    nowDate: Date.now(),
    tracks: {},
    albums: {},
    artists: {},
    users: {},
    localforageEnabled: true,
  },
  mutations: {
    saveTrack(state, { id, track }: { id: string; track: StateTrack }) {
      state.tracks[id] = track
    },
    saveAlbum(state, { id, album }: { id: string; album: StateAlbum }) {
      state.albums[id] = album
    },
    saveArtist(state, { id, artist }: { id: string; artist: StateArtist }) {
      state.artists[id] = artist
    },
    setNowDate(state, date) {
      state.nowDate = date
    },
    updateUser(state, { userId, data }) {
      state.users[userId] = { ...state.users[userId], ...data }
    },
    reinitUsers(state) {
      state.users = { ...state.users }
    },
    disableLocalforage(state) {
      state.localforageEnabled = false
    },
  },
  actions: {
    updateNow({ commit }) {
      commit('setNowDate', Date.now())
    },
    async loadIndexedDB() {
      // try {
      //   const tracksStr = await localforage.getItem('tracks')
      //   if (!tracksStr) return
      //   const tracks = JSON.parse(tracksStr)
      //   const artists = JSON.parse(await localforage.getItem('artists'))
      //   const albums = JSON.parse(await localforage.getItem('albums'))
      //   for (const [id, track] of Object.entries(tracks))
      //     commit('saveTrack', { id, track })
      //   for (const [id, artist] of Object.entries(artists))
      //     commit('saveArtist', { id, artist })
      //   for (const [id, album] of Object.entries(albums))
      //     commit('saveAlbum', { id, album })
      // } catch (error) {
      //   commit('disableLocalforage')
      // }
    },
    async saveTracks({ commit, state }, tracks: Track[]) {
      let changes = 0
      tracks.forEach(track => {
        if (track.id in state.tracks) return
        changes += 1
        commit('saveTrack', {
          id: track.id,
          track: {
            id: track.id,
            album: track.album.id,
            artists: track.artists.map(artist => artist.id),
            name: track.name,
            duration: track.duration_ms,
          },
        })
        track.artists.forEach(artist => {
          if (artist.id in state.artists) return
          commit('saveArtist', {
            id: artist.id,
            artist: {
              id: artist.id,
              name: artist.name,
            },
          })
        })
        if (!(track.album.id in state.albums)) {
          commit('saveAlbum', {
            id: track.album.id,
            album: {
              id: track.album.id,
              name: track.album.name,
              images: track.album.images,
            },
          })
        }
      })
      if (changes > 0 && state.localforageEnabled) {
        await localforage.setItem('tracks', JSON.stringify(state.tracks))
        await localforage.setItem('artists', JSON.stringify(state.artists))
        await localforage.setItem('albums', JSON.stringify(state.albums))
      }
    },
    updateUser({ commit }, { userId, data }) {
      commit('updateUser', { userId, data })
    },
    reinitUsers({ commit }) {
      commit('reinitUsers')
    },
  },
})
