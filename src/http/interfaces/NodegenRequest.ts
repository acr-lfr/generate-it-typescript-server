import express from 'express';
{% if nodegenRc.helpers.stub.jwtType %}import { {{ nodegenRc.helpers.stub.jwtType }} } from '@/http/nodegen/interfaces';{% endif %}

export default interface NodegenRequest extends express.Request {
  jwtData: {{ nodegenRc.helpers.stub.jwtType if nodegenRc.helpers.stub.jwtType else 'any' }};
  originalToken: string;
  clientIp: string;
}
