'use strict';

const {
  sinks: { ssrf }
} = require('@contrast/test-bench-utils');

exports.name = 'hapitestbench.ssrf';

const EXAMPLE_URL = 'http://www.example.com';

const createUnsafeUrl = (input) => `${EXAMPLE_URL}?q=${input}`;

const createSafeUrl = (input) =>
`${EXAMPLE_URL}?q=${encodeURIComponent(input)}`;

exports.register = function ssrf(server, options) {
  server.route([
    {
      method: 'GET',
      path: '/',
      handler: {
        view: 'ssrf'
      }
    },
    {
      method: 'POST',
      path: '/{lib}/unsafe',
      handler: async (request, h) => {
        let input = request.payload.input;
        const url = createUnsafeUrl(input);
        const data = await makeRequest(request.params.lib, url);
        return data;
      }
    },
    {
      method: 'POST',
      path: '/{lib}/safe',
      handler: async (request, h) => {
        let input = request.payload.input;
        const url = createSafeUrl(input);
        const data = await makeRequest(request.params.lib, url);
        return data;
      }
    },
    {
      method: 'GET',
      path: '/{lib}/unsafe',
      handler: async (request, h) => {
        let input = request.query.input;
        const url = createUnsafeUrl(input);
        const data = await makeRequest(request.params.lib, url);
        return data;
      }
    },
    {
      method: 'GET',
      path: '/{lib}/safe',
      handler: async (request, h) => {
        let input = request.query.input;
        const url = createSafeUrl(input);
        const data = await makeRequest(request.params.lib, url);
        return data;
      }
    }
  ]);
};

const makeRequest = async function makeRequest(lib, url) {
  switch (lib) {
    case 'axios':
      return ssrf.makeAxiosRequest(url);
    case 'bent':
      return ssrf.makeBentRequest(url);
    case 'fetch':
      return ssrf.makeFetchRequest(url);
    case 'request':
      return ssrf.makeRequestRequest(url);
    case 'superagent':
      return ssrf.makeSuperagentRequest(url);
  }
};
