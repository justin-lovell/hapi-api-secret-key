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


function createInterceptor(options) {
  var secrets = (options && options.secrets) || loadApiKeysFromEnvironmentVariables();
  var fetchUserSuppliedSecret = options.fetchUserApiKey || createFetchUserApiKey();

  return function (request, reply) {
    var tags = request.route.settings.tags;
    if (!tags || tags.indexOf('api') < 0) {
      return reply.continue();
    }

    var isLocalHost = request.info.hostname.toLowerCase() === 'localhost';
    if (isLocalHost && (!secrets || !secrets.length)) {
      return reply.continue();
    }

    var apiKey = fetchUserSuppliedSecret(request);
    if (secrets && secrets.indexOf(apiKey) >= 0) {
      return reply.continue();
    }

    return reply(Boom.unauthorized(unauthorizedMessageText));
  }
}


const plugin = {
  register: function (server, options, next) {

    server.ext('onPreAuth', createInterceptor(options));
    next();
  }
};

plugin.register.attributes = {
  name: "hapi-api-secret-key",
  version: '1.1.0'
};

module.exports = {
  plugin,
  messages: {
    unauthorized: unauthorizedMessageText
  }
};
