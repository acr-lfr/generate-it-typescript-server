import jwt from 'jsonwebtoken';
import _ from 'lodash';
import config from '../config';
import NodegenRequest from '@/http/nodegen/interfaces/NodegenRequest';
import express = require('express');

interface JwtDetails {
  maxAge: number;
  sessionData: any;
}

class AccessTokenService {
  /**
   * Used by the validateRequest method
   * @param res
   * @param e
   * @param msg
   * @param headersProvidedString
   */
  private denyRequest (res: express.Response, e: any, msg = 'Invalid auth token provided', headersProvidedString: string = '') {
    console.error(e);
    res.status(401).json({
      message: msg,
      token: headersProvidedString,
    });
  }

  /**
   * Validates incoming requests, expects Bearer <token>
   * Passes on the 1st security element found in the headers.
   * !! Extend this accordingly as required should Bearer not be used.
   * !! Note the src/http/nodegen/security/definitions.ts.njk contains all security definitions
   * @param req
   * @param res
   * @param next
   * @param headerNames
   */
  public validateRequest (req: NodegenRequest, res: express.Response, next: express.NextFunction, headerNames: string[]) {
    let token;
    for (let i = 0; i < headerNames.length; ++i) {
      let tokenRaw = String(req.headers[headerNames[i].toLowerCase()] || req.headers[headerNames[i]] || '');
      if (tokenRaw.length > 0) {
        let tokenParts = tokenRaw.split('Bearer ');
        if (tokenParts.length > 0) {
          token = tokenParts[1];
          break;
        }
      }
    }

    if (!token) {
      return this.denyRequest(
        res,
        'No token to parse',
        'No auth token provided.',
        JSON.stringify(req.headers)
      );
    }

    this.verifyAccessJWT(token)
      .then((decodedToken: any) => {
        req.jwtData = decodedToken;
        req.originalToken = token;
        next();
      })
      .catch(() => {
        this.denyRequest(res, 'Auth signature invalid.', 'Invalid auth token!');
      });
  }

  /**
   * Generates a JTW token
   * @param details
   */
  public generateJWToken (details: JwtDetails) {
    if (typeof details.maxAge !== 'number') {
      details.maxAge = 3600;
    }

    details.sessionData = _.reduce(details.sessionData || {}, (memo: any, val: any, key: string) => {
      if (typeof val !== 'function' && key !== 'password') {
        memo[key] = val;
      }
      return memo;
    }, {});
    return jwt.sign({
      data: details.sessionData,
    }, config.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: details.maxAge,
    });
  }

  /**
   * Verifies a given JWT token
   * @param token
   */
  public async verifyAccessJWT (token: string) {
    return jwt.verify(token, config.jwtSecret);
  }
}

export default new AccessTokenService();
