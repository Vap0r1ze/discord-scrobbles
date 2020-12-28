import { ApiBase } from './ApiBase'
import { ScrobbleClient } from './ScrobbleClient'

export interface Restrictions { reason: 'market' | 'product' | 'explicit' | string }
export interface Copyright { text: string; type: 'C' | 'P' }
export interface Followers { href: string; total: number }

export interface Paging<T> {
  href: string;
  items: T[];
  limit: number;
  next?: string;
  offset: number;
  previous?: string;
  total: number;
}

/**
 * Apparently its possible for an album to not have a cover image lol
 * E.g: https://open.spotify.com/album/0fHB3Fl84QT2cjwDTEKXon (https://i.imgur.com/SEvnvpI.png)
 * */
export type Image = {
  height?: number;
  url: string;
  width: number;
} | undefined
export interface ArtistSimple {
  external_urls: Record<string, string>;
  href: string;
  id: string;
  name: string;
  type: string;
  uri: string;
}
export interface AlbumSimple {
  album_group?: string;
  album_type: string;
  artists: ArtistSimple[];
  available_markets: string[];
  external_urls: Record<string, string>;
  href: string;
  id: string;
  images: Image[];
  name: string;
  release_date: string;
  release_date_precision: 'year' | 'month' | 'day';
  restrictions: Restrictions;
  type: string;
  uri: string;
}
export interface Track {
  album: AlbumSimple;
  artists: ArtistSimple[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: Record<string, string>;
  external_urls: Record<string, string>;
  href: string;
  id: string;
  // is_playable: boolean,
  // linked_from: aaaaaaa
  restrictions: Restrictions;
  name: string;
  popularity: number;
  preview_url: string;
  track_number: number;
  type: string;
  uri: string;
}
export interface Artist extends ArtistSimple {
  followers: Followers;
  genres: string[];
  images: Image[];
  popularity: number;
}
export interface Album extends AlbumSimple {
  copyrights: Copyright[];
  genres: string[];
  label: string;
  popularity: number;
  tracks: Paging<Track>;
}
export interface User {
  display_name: string;
  external_urls: Record<string, string>;
  followers: Followers;
  href: string;
  id: string;
  images: Image[];
  type: string;
  uri: string;
}
export interface PlaylistTrack {
  added_at?: string;
  added_by: User;
  is_local: boolean;
  track: Track;
}
export interface Playlist {
  collaborative: boolean;
  description?: string;
  external_urls: Record<string, string>;
  followers: Followers;
  href: string;
  id: string;
  images: Image[];
  name: string;
  owner: User;
  public?: boolean;
  snapshot_id: string;
  tracks: Paging<PlaylistTrack>;
  type: string;
  uri: string;
}

export interface SeveralTracks { tracks: Track[] }
export type SpotifyClientResponse = Track | SeveralTracks | Artist | Album | Playlist

export class SpotifyClient extends ApiBase {
  constructor(scrobbleClient: ScrobbleClient) {
    super(process.env.VUE_APP_SPOTIFY_API)
    scrobbleClient
      .getSpotifyToken()
      .then(data => {
        if (!data.token) { console.error('Could not get spotify token: token is null') } else this.setToken(data.token, data.tokenType)
      })
      .catch(error => {
        console.error('Could not get spotify token:', error)
      })
  }

  getTrack(trackId: string): Promise<Track> {
    return this.apiRequestBody('get', `/tracks/${trackId}`)
  }

  getTracks(trackIds: string[]): Promise<SeveralTracks> {
    return this.apiRequestBody('get', `/tracks?ids=${trackIds.join(',')}`)
  }

  getAlbum(albumId: string): Promise<Album> {
    return this.apiRequestBody('get', `/albums/${albumId}`)
  }

  getPlaylist(playlistId: string, query = ''): Promise<Playlist> {
    return this.apiRequestBody('get', `/playlists/${playlistId}?${query}`)
  }
}
