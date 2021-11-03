import express from 'express';
{% if nodegenRc.helpers.stub.jwtType %}import { {{ nodegenRc.helpers.stub.jwtType }} } from '@/http/nodegen/interfaces';{% endif %}
{% if nodegenRc.helpers.stub.requestTypeExtensionPath %}import Ext from '{{ nodegenRc.helpers.stub.requestTypeExtensionPath }}';{% endif %}

export default interface NodegenRequest extends express.Request{% if nodegenRc.helpers.stub.requestTypeExtensionPath %}, Ext{% endif %} {
  jwtData: {{ nodegenRc.helpers.stub.jwtType if nodegenRc.helpers.stub.jwtType else 'any' }};
  originalToken: string;
  clientIp?: string;
}
