import express from 'express';

declare global {
  namespace Express {
    export interface Response {
      // src/http/nodegen/middleware/inferResponseType.ts
      inferResponseType: (
        dataOrPath: any,
        status: number,
        produces?: string,
        outputMap?: Record<string, any>
      ) => any;
    }
  }
}

type GenerateItExpressResponse = express.Response;
export default GenerateItExpressResponse;
