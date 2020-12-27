import { SpotifyClient } from './types/Spotify'
import { ScrobbleClient } from './types/ScrobbleClient'

export const scrobbleClient = new ScrobbleClient()
export const spotify = new SpotifyClient(scrobbleClient)
