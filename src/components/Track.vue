<template>
  <div class="spotify-track" :class="{ small: !large }">
    <div class="cover-wrapper" v-if="!hideCover">
      <div
        class="cover-fade"
        :style="{
        background: `linear-gradient(to right, ${bg}, rgba(0, 0, 0, 0))`
      }"
      ></div>
      <img class="cover" :src="coverImage" :alt="albumName" :title="albumName">
    </div>
    <div class="content" :style="{
      background: bg,
      color: text
    }">
      <div class="title">
        <a
          :href="`https://open.spotify.com/track/${trackId}`"
          target="_blank"
        >{{ tracks[trackId].name }}</a>
        <div class="spacer"></div>
        <span class="note" v-if="note">{{ note }}</span>
      </div>
      <div class="artists">
        <span v-for="(artistId, i) in tracks[trackId].artists" :key="artistId">
          <a
            :href="`https://open.spotify.com/artist/${artistId}`"
            target="_blank"
          >{{ artists[artistId].name }}</a>
          <span v-if="i !== tracks[trackId].artists.length - 1">,&nbsp;</span>
        </span>
      </div>
    </div>
    <div class="palette" v-if="showPalette">
      <div
        class="swatch"
        v-for="(swatch, i) in palette"
        :key="i"
        :style="{
          background: swatch
        }"
      />
    </div>
  </div>
</template>

<script lang="ts">
import {
  Component, Prop, Vue, Watch,
} from 'vue-property-decorator'
import { mapState } from 'vuex'
import Vibrant from 'node-vibrant'
import {
  Cache, StateAlbum, StateArtist, StateTrack,
} from '@/store'
import UserComponent from './User.vue'

const ratioCorrection = 1.8

@Component({
  name: 'Track',
  computed: mapState(['tracks', 'albums', 'artists']),
})
export default class TrackComponent extends Vue {
  $parent!: UserComponent

  @Prop({ type: String, required: true }) readonly trackId!: string

  @Prop(Boolean) readonly large!: string

  @Prop(Boolean) readonly autoPalette!: boolean

  @Prop(Boolean) readonly hideCover!: boolean

  @Prop(Boolean) readonly showPalette!: boolean

  @Prop(String) readonly note!: string

  tracks!: Cache<StateTrack>

  albums!: Cache<StateAlbum>

  artists!: Cache<StateArtist>

  bg = ''

  text = ''

  palette: string[] = []

  @Watch('trackId')
  onTrackUpdate() {
    if (this.autoPalette) this.updatePalette()
  }

  get coverImage() {
    const { trackId, tracks, albums } = this
    const track = tracks[trackId]
    if (!track) {
      console.log(
        'Track %s not saved, from user %s',
        trackId,
        this.$parent.userId,
      )
      return null
    }
    const albumId = track.album
    const album = albums[albumId]
    if (!album) {
      console.log(
        'Album %s not saved, from track %s',
        albumId,
        trackId,
      )
      return null
    }
    return album.images[0].url
  }

  get albumName() {
    const { trackId, tracks, albums } = this
    const track = tracks[trackId]
    if (!track) {
      console.log(
        'Track %s not saved, from user %s',
        trackId,
        this.$parent.userId,
      )
      return null
    }
    const albumId = track.album
    const album = albums[albumId]
    if (album == null) {
      console.log(
        'Album %s not saved, from track %s',
        albumId,
        trackId,
      )
      return null
    }
    return album.name
  }

  updatePalette() {
    this.palette = []
    this.bg = ''
    this.text = ''
    if (!this.coverImage) return
    Vibrant.from(this.coverImage)
      .getPalette()
      .then(palette => {
        if (!(
          palette.Vibrant && palette.Muted && palette.DarkVibrant
          && palette.DarkMuted && palette.LightVibrant && palette.LightMuted
        )) return
        this.bg = palette.DarkMuted.getHex()
        this.text = palette.LightVibrant.getHex()
        const lightVibrantHSL = Vibrant.Util.rgbToHsl(
          palette.LightVibrant.r,
          palette.LightVibrant.g,
          palette.LightVibrant.b,
        )
        const darkMutedHSL = Vibrant.Util.rgbToHsl(
          palette.DarkMuted.r,
          palette.DarkMuted.g,
          palette.DarkMuted.b,
        )
        const dml = darkMutedHSL[2]
        const lvl = lightVibrantHSL[2]
        const ratio = (Math.max(dml, lvl) + 0.05) / (Math.min(dml, lvl) + 0.05)
        if (ratio < ratioCorrection) {
          let newLvl = lvl
          if (dml < 0.5) {
            newLvl = ratioCorrection * (dml + 0.05) - 0.05
            newLvl = Math.min(1, newLvl)
          }
          const newLvHsl = lightVibrantHSL
            .slice(0, 2)
            .concat(newLvl)
          const newLvRgb = Vibrant.Util.hslToRgb(newLvHsl[0], newLvHsl[1], newLvHsl[2])
          const newLvHex = Vibrant.Util.rgbToHex(newLvRgb[0], newLvRgb[1], newLvRgb[2])
          this.text = newLvHex
        }
        if (this.showPalette) {
          this.palette.push(palette.Vibrant.getHex())
          this.palette.push(palette.Muted.getHex())
          this.palette.push(palette.DarkVibrant.getHex())
          this.palette.push(palette.DarkMuted.getHex())
          this.palette.push(palette.LightVibrant.getHex())
          this.palette.push(palette.LightMuted.getHex())
        }
      })
  }

  created() {
    if (this.autoPalette) {
      this.updatePalette()
    }
  }
}
</script>

<style lang="scss">
.spotify-track {
  display: flex;
  flex-direction: column;
  font-family: Circular, 'Open Sans', Arial, Helvetica, sans-serif;
  width: 192px;

  &.small {
    flex-direction: row-reverse;
    width: 100%;

    .cover-fade {
      opacity: 1;
    }
    .cover {
      width: 64px;
    }
    .title {
      margin-bottom: 4px;
    }
    .palette {
      flex-direction: column;
      .swatch {
        height: auto;
        width: 10px;
      }
    }
  }

  .cover-wrapper {
    line-height: 0;
    position: relative;
  }
  .cover-fade {
    opacity: 0;
    pointer-events: none;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
  .cover {
    overflow: hidden;
    width: 192px;
  }
  .content {
    background: #282828;
    color: #FFF;
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
    padding: 10px 8px;
    a {
      color: inherit;
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
  }
  .title {
    display: flex;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 2px;
    a {
      overflow: hidden;
      padding-right: 48px;
      text-overflow: ellipsis;
    }
  }
  .spacer {
    flex: 1;
  }
  .artists {
    font-size: 12px;
    opacity: 0.5;
  }
  .note {
    color: rgba(#FFF, 0.25);
    float: right;
    font-weight: 400;
  }
  .title,
  .artists {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .palette {
    display: flex;
    .swatch {
      flex: 1;
      height: 10px;
    }
  }
}
</style>
