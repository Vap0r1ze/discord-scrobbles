<template>
  <div class="home">
    <div class="feed" v-if="ready">
      <DynamicScroller :items="userIds" :min-item-size="36" class="scroller">
        <template v-slot="{ item, index, active }">
          <DynamicScrollerItem :item="item" :active="active" :data-index="index">
            <User :userId="item"/>
          </DynamicScrollerItem>
        </template>
      </DynamicScroller>
    </div>
    <div class="splash" v-else>
      <div class="progress-desc">{{ loadingData.desc }}</div>
      <div class="progress-bar">
        <div
          class="progress"
          :style="{
            width: `${Math.max(Math.round(loadingData.complete / loadingData.total * 100), 2)}%`
          }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { ErrorCallback, queue } from 'async'
import { mapState } from 'vuex'
import qs from 'qs'
import UserComponent from '@/components/User.vue'
import { Track } from '@/types/Spotify'
import { ScrobbleResponse } from '@/types/ScrobbleClient'
import { Cache, State } from '@/store'
import { spotify, scrobbleClient } from '../api'

const q = qs.parse(window.location.search.slice(1))
const searchForUsers = typeof q.users === 'string' ? q.users.split(',') : ['*']
const hideHistory = Boolean(q.hidehistory != null)

let cachedTracks: Track[] = []
let cachedUsers: Cache<ScrobbleResponse> = {}

@Component({
  name: 'Home',
  components: {
    User: UserComponent,
  },
  computed: mapState(['tracks', 'users']),
})
export default class Home extends Vue {
  tracks!: State['tracks']

  users!: State['users']

  userIds: string[] = []

  ready = false

  tracksQueue = queue(this.tracksHandler, 2)

  loadingData = {
    total: 1,
    complete: 0,
    desc: '',
  }

  refreshData() {
    if (!this.ready) {
      this.loadingData.total = 1
      this.loadingData.complete = 0
      this.loadingData.desc = 'Grabbing User Data'
    }
    let userIds: string[]
    return scrobbleClient
      .getUsers(searchForUsers)
      .then((users): Promise<void> | null => {
        userIds = users.map(user => user.user.id)
        const trackIds: string[] = []
        const trackIdBuckets: string[][] = []
        userIds.forEach(userId => {
          const user = users.find(u => u.user.id === userId)
          if (!user) return
          if (hideHistory) {
            user.scrobbles = [user.scrobbles[0]]
          }
          // const lastScrobble = user.scrobbles[0]
          // const lastListen = !lastActivity || !lastActivity.t
          //   ? null
          //   : lastActivity.s + lastActivity.t
          cachedUsers[userId] = user
          user.scrobbles.forEach(scrobble => {
            if (/^[a-z0-9]{22}$/i.test(scrobble.id)) {
              if (!trackIds.includes(scrobble.id) && !this.tracks[scrobble.id]) {
                trackIds.push(scrobble.id)
              }
            } else {
              console.log('Invalid ID "%s" from user %s', scrobble.id, userId)
            }
          })
        })
        if (trackIds.length) {
          for (let i = 0; i < trackIds.length; i += 1) {
            if (i % 50 === 0) trackIdBuckets.unshift([])
            trackIdBuckets[0].push(trackIds[i])
          }
          if (!this.ready) {
            this.loadingData.total = trackIdBuckets.length
            this.loadingData.complete = 0
            this.loadingData.desc = 'Loading Spotify Data'
          }
          this.tracksQueue.push(trackIdBuckets)
          return this.tracksQueue.drain()
        }
        return null
      })
      .then(() => {
        this.$store.dispatch('saveTracks', cachedTracks)
        Object.entries(cachedUsers).forEach(([userId, data]) => {
          this.$store.dispatch('updateUser', { userId, data })
        })
        this.userIds = userIds
        cachedTracks = []
        cachedUsers = {}
        this.sortUsers()
      })
      .catch(error => {
        console.error(error)
      })
  }

  // usersHandler(userIds, callback) {
  //   if (userIds.length > 72) {
  //     const extraUserIds = userIds.slice(72)
  //     userIds = userIds.slice(0, 72)
  //     this.tracksQueue.push([extraUserIds])
  //   }
  //   scrobbleClient
  //     .getMultiData('/dspotify', userIds)
  //     .then(users => {
  //       if (!this.ready) {
  //         this.loadingData.complete++
  //         console.log(
  //           'Loaded %s users, %s buckets complete',
  //           Object.keys(users).length,
  //           this.loadingData.complete
  //         )
  //       }
  //       Object.assign(cachedUsers, users)
  //     })
  //     .catch(error => {
  //       console.error(error)
  //     })
  // },
  tracksHandler(trackIdsIn: string[], callback: ErrorCallback) {
    let trackIds = trackIdsIn
    if (trackIds.length > 50) {
      const extraTrackIds = trackIds.slice(50)
      trackIds = trackIds.slice(0, 50)
      this.tracksQueue.push([extraTrackIds])
    }
    spotify
      .getTracks(trackIds)
      .then(({ tracks }) => {
        if (!this.ready) {
          this.loadingData.complete += 1
          console.log(
            'Loaded %s tracks, %s buckets complete',
            tracks.length,
            this.loadingData.complete,
          )
        }
        cachedTracks.push(...tracks)
        callback()
      })
      .catch(error => {
        if (error.status === 429) {
          const retryTimeout = parseInt(
            error.response.headers['retry-after'],
            10,
          )
          console.log('Bucket ratelimited, retrying in %ss', retryTimeout)
          setTimeout(() => {
            this.tracksHandler(trackIds, callback)
          }, retryTimeout * 1000 + 500)
        } else if (error.status === 401) {
          console.log('Spotify access token expired, obtaining a fresh one')
          scrobbleClient.getSpotifyToken().then(({ token, tokenType }) => {
            spotify.setToken(token, tokenType)
            this.tracksHandler(trackIds, callback)
          })
        } else {
          console.error(error)
        }
      })
  }

  dataInterval() {
    setTimeout(() => {
      this.refreshData().then(() => {
        this.dataInterval()
      })
    }, 1000)
  }

  sortUsers() {
    const { users } = this
    const listening: string[] = []
    const notListening: string[] = []
    this.userIds.forEach(userId => {
      const user = users[userId]
      if (!user) return
      if (user.scrobbles[0] && user.scrobbles[0].endTime == null) listening.push(userId)
      else notListening.push(userId)
    })
    listening.sort((a, b) => {
      const userA = users[a]
      const userB = users[b]
      if (!userA || !userB) return 0
      if (
        userA.user.username.toLowerCase()
        > userB.user.username.toLowerCase()
      ) { return 1 }
      if (
        userA.user.username.toLowerCase()
        < userB.user.username.toLowerCase()
      ) { return -1 }
      return 0
    })
    notListening.sort((a, b) => {
      const userA = users[a]
      const userB = users[b]
      if (!userA || !userB) return 0
      if (userA.scrobbles[0].startTime > userB.scrobbles[0].startTime) return -1
      if (userA.scrobbles[0].startTime < userB.scrobbles[0].startTime) return 1
      return 0
    })
    this.userIds = listening.concat(notListening)
  }

  created() {
    this.$store
      .dispatch('loadIndexedDB')
      .then(() => this.refreshData())
      .then(() => {
        this.ready = true
        this.dataInterval()
      })
  }
}
</script>

<style lang="scss">
.home {
  align-items: center;
  background: #121212;
  display: flex;
  flex-direction: column;
  padding: 48px;
  .feed {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    width: 400px;
  }
  .splash {
    align-items: center;
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: center;
    .progress-desc {
      color: rgba(#FFF, 0.625);
      margin-bottom: 6px;
    }
    .progress-bar {
      background: rgba(#FFF, 0.25);
      border-radius: 999px;
      display: inline-flex;
      height: 6px;
      justify-content: flex-start;
      overflow: hidden;
      width: 300px;
    }
    .progress {
      background: rgba(#FFF, 0.5);
      height: 100%;
    }
  }
}
</style>
