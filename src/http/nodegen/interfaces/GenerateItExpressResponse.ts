import express from 'express';

export default interface GenerateItExpressResponse extends express.Response {
  // src/http/nodegen/middleware/inferResponseType.ts
  inferResponseType: (
    dataOrPath: any,
    status: number,
    produces: string,
    outputMap?: Record<string, any>
  ) => any
}