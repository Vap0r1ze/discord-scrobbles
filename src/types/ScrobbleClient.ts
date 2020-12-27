import { ApiBase } from './ApiBase'

export type SpotifyTokenData = {
  token: string;
  type: string;
}
export interface Scrobble {
  id: string;
  startTime: number;
  endTime: number | null;
}
export interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
}
export interface ScrobbleResponse {
  user: User;
  scrobbles: Scrobble[];
}

export class ScrobbleClient extends ApiBase {
  constructor() {
    super(process.env.VUE_APP_SCROBBLE_API)
  }

  async getSpotifyToken() {
    const data: SpotifyTokenData = await this.apiRequestBody('get', '/spotify-token')
    return { token: data.token, tokenType: data.type }
  }

  getUsers(userIds: string[]): Promise<ScrobbleResponse[]> {
    return this.apiRequestBody('get', `?q=${userIds.join(',')}`)
  }
}
