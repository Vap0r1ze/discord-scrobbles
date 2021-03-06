import Vue from 'vue'
import Vuex from 'vuex'
import localforage from 'localforage'
import { Image, Track } from '@/types/Spotify'
import { ScrobbleResponse } from '@/types/ScrobbleClient'

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

export interface StateAlbum {
  id: string;
  name: string;
  images: Image[];
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
  users: Cache<ScrobbleResponse>;
  openHistories: Cache<boolean>;
  localforageEnabled: boolean;
}

export default new Vuex.Store<State>({
  state: {
    nowDate: Date.now(),
    tracks: {},
    albums: {},
    artists: {},
    users: {},
    openHistories: {},
    localforageEnabled: true,
  },
  mutations: {
    saveTrack(state, { id, track }: { id: string; track: StateTrack }) {
      Vue.set(state.tracks, id, track)
    },
    saveAlbum(state, { id, album }: { id: string; album: StateAlbum }) {
      Vue.set(state.albums, id, album)
    },
    saveArtist(state, { id, artist }: { id: string; artist: StateArtist }) {
      Vue.set(state.artists, id, artist)
    },
    setNowDate(state, date) {
      state.nowDate = date
    },
    updateUser(state, { userId, data }: { userId: string; data: ScrobbleResponse }) {
      Vue.set(state.users, userId, { ...state.users[userId], ...data })
    },
    disableLocalforage(state) {
      state.localforageEnabled = false
    },
    setHistoryState(state, { userId, open }: { userId: string; open: boolean }) {
      Vue.set(state.openHistories, userId, open)
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
    updateUser({ commit }, { userId, data }: { userId: string; data: ScrobbleResponse }) {
      commit('updateUser', { userId, data })
    },
    setHistoryState({ commit }, { userId, open }: { userId: string; open: boolean }) {
      commit('setHistoryState', { userId, open })
    },
  },
})
