declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'production' | 'development';
    BASE_URL: string;
    VUE_APP_SCROBBLE_API: string;
    VUE_APP_SPOTIFY_API: string;
  }
}
