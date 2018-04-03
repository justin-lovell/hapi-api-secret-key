'use strict';

var Boom = require('boom');

const unauthorizedMessageText = 'The correct API Key was not provided by the client';

function loadApiKeysFromEnvironmentVariables() {
  var keys = [];

  var curr;
  while (curr = process.env['API_KEY_' + (keys.length + 1)]) {
    keys.push(curr);
  }

  return keys;
}


function createFetchUserApiKey() {
  return function fetchUserSuppliedUserApiKey(request) {
    return request.headers["api-key"] || request.query["api-key"];
  }
}

function createDefaultShouldApplyApiKeyFiltering() {
  return function shouldApplyApiKeyFiltering(request) {
    var tags = request.route.settings.tags;
    return tags && tags.indexOf('api') >= 0;
  }
}


function createInterceptor(options) {
  var secrets = (options && options.secrets) || loadApiKeysFromEnvironmentVariables();
  var fetchUserSuppliedSecret = options.fetchUserApiKey || createFetchUserApiKey();
  var shouldApplyFilter = options.shouldApplyApiFilter || createDefaultShouldApplyApiKeyFiltering();

  return async (request, h) => {
    if (!shouldApplyFilter(request)) {
      return h.continue;
    }

    var isLocalHost = request.info.hostname.toLowerCase() === 'localhost';
    if (isLocalHost && (!secrets || !secrets.length)) {
      return h.continue;
    }

    var apiKey = fetchUserSuppliedSecret(request);
    if (secrets && secrets.indexOf(apiKey) >= 0) {
      return h.continue;
    }

    throw Boom.unauthorized(unauthorizedMessageText);
  }
}


const plugin = {
  name: 'hapi-api-secret-key',
  version: '2.0.0',
  register(server, options) {
    server.ext('onPreAuth', createInterceptor(options));
  }
};

module.exports = {
  plugin,
  messages: {
    unauthorized: unauthorizedMessageText
  }
};
