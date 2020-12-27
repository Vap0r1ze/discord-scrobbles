export const scrobbleApiBase = process.env.NODE_ENV === 'development'
  ? '/scrobbles'
  : 'https://puss.vap.cx/scrobbles'

export const spotifyApiBase = 'https://api.spotify.com/v1'
