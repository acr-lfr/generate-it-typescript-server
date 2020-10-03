import express from 'express';
import objectReduceByMap from 'object-reduce-by-map';
import NodegenRequest from '@/http/interfaces/NodegenRequest';
import getPreferredResponseFormat from '@/http/nodegen/utils/getPreferredResponseFormat';
import GenerateItExpressResponse from '@/http/nodegen/interfaces/GenerateItExpressResponse';

export default () => {

  return (req: NodegenRequest, res: GenerateItExpressResponse, next: express.NextFunction) => {

    res.inferResponseType = (
      dataOrPath = undefined,
      status = 200,
      permittedTypes,
      outputMap?
    ) => {
      // Send only a status when data is undefined
      if (dataOrPath === undefined) {
        return res.sendStatus(status);
      }

      // Calculate the calculatedAcceptHeader based on the provided accept header
      // When the accept header is not provided then we fallback to the 1st permittedType
      // The last fallback is then application/json
      const calculatedAcceptHeader = req.headers['accept'] ?
        getPreferredResponseFormat(req.headers['accept'], Array.isArray(permittedTypes) ? permittedTypes : [permittedTypes]) :
        permittedTypes[0] || 'application/json';

      if (calculatedAcceptHeader) {
        // The most typical is json so lets catch it 1st
        if (calculatedAcceptHeader === 'application/json') {
          return res
            .status(status)
            .json(
              objectReduceByMap(
                dataOrPath,
                outputMap
              )
            );
        }

        // All images use with sendFile
        if (calculatedAcceptHeader.includes('image/') || calculatedAcceptHeader.includes('font/')) {
          return res.sendFile(dataOrPath);
        }

        // Simple pass for text/* let the consumer handle the rest
        if (calculatedAcceptHeader.includes('text/')) {
          return res
            .set('Content-Type', calculatedAcceptHeader)
            .status(status)
            .send(dataOrPath);
        }

        // Everything else we assume the input is a path to a file and should be downloaded
        // XML is typically sent not downloaded but fairly outdated today so the converter js2xmlparser
        // is not included
        return res.download(dataOrPath);

      } else if (req.headers['accept'] && !calculatedAcceptHeader) {
        console.error(`Accept Header ${req.headers['accept']} requested but not permitted`);
        return res
          .status(406)
          .send(`Requested content-type "${req.headers['accept']}", only ${JSON.stringify(permittedTypes)} permitted for this route.`);
      }

      // default catch all is json
      // We got here by not defining response content types in the openapi file
      return res
        .status(status)
        .json(
          objectReduceByMap(
            dataOrPath,
            outputMap
          )
        );
    };

    next();
  };
}