import EventEmitter from 'eventemitter3'
import superagent from 'superagent'

export type Method = 'get' | 'post' | 'put'

export class ApiBase extends EventEmitter {
  apiBase: string

  token?: string

  constructor(apiBase: string, apiToken?: string, tokenType?: string) {
    super()
    if (apiToken) { this.setToken(apiToken, tokenType) }
    this.apiBase = apiBase
  }

  get isAuthenticated() {
    return Boolean(this.token)
  }

  setToken(apiToken: string, tokenType?: string) {
    if (tokenType) this.token = `${tokenType} ${apiToken}`
    else this.token = apiToken
    this.emit('tokenUpdate')
  }

  apiRequestRaw(method: Method, path: string, body?: object): Promise<superagent.Response> {
    let request = superagent[method](this.apiBase + path)
    if (this.token) request = request.set('Authorization', this.token)
    if (body) request = request.send(body)
    return new Promise((resolve, reject) => {
      request.end((error, response) => {
        if (error) reject(error)
        if (response) resolve(response)
      })
    })
  }

  async apiRequestBody(method: Method, path: string, body?: object) {
    const response = await this.apiRequestRaw(method, path, body)
    return response.body
  }
}
