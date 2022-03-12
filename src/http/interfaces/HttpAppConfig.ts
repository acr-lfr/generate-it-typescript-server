export interface HttpAppConfig {
  loadSwaggerUIRoute: boolean,
  swaggerBasicAuth: { basicAuthUname: string, basicAuthPword: string }[],
  env: string,
  port: number,
  corsWhiteList: string,
  jwtAccessSecret?: string,
  apiKey?: string,
  requestWorker: {
    processes: number,
    threadsPerProcess: number,
    timeoutMs: number,
    silent: boolean
  }
}
