import express from 'express';
{% if nodegenRc.helpers.stub.jwtType %}import { {{ nodegenRc.helpers.stub.jwtType }} } from '@/http/nodegen/interfaces';{% endif %}
{% if nodegenRc.helpers.stub.requestTypeExtensionPath %}import Ext from '{{ nodegenRc.helpers.stub.requestTypeExtensionPath }}';{% endif %}
declare global {
  namespace Express {
    export interface Request {
      jwtData: {{ nodegenRc.helpers.stub.jwtType if nodegenRc.helpers.stub.jwtType else 'any' }};
      originalToken: string;
      clientIp?: string;
      /** If content-negotiation fails, default to this Content-Type instead of throwing. Can be set in the domain. */
      defaultContentType?: string;
    }
  }
}

type NodegenRequest = express.Request{% if nodegenRc.helpers.stub.requestTypeExtensionPath %} & Ext{% endif %};
export default NodegenRequest;
