import express from 'express';

export default interface GenerateItExpressResponse extends express.Response {
  inferResponseType: (
    dataOrPath: any,
    status: number,
    permittedTypes: string | string[],
    outputMap?: any
  ) => any
}