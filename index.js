'use strict';

var Boom = require('boom');


const unauthorizedMessageText = 'The correct API Key was not provided by the client';

function createInterceptor(options) {
  var secrets = (options && options.secrets) || [];

  return function (request, reply) {
    var tags = request.route.settings.tags;
    if (!tags || tags.indexOf('api') < 0) {
      return reply.continue();
    }

    var isLocalHost = request.info.hostname.toLowerCase() === 'localhost';
    if (isLocalHost && (!secrets || !secrets.length)) {
      return reply.continue();
    }

    var apiKey = request.headers["api-key"] || request.query["api-key"];
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
  version: '1.0.0'
};

module.exports = {
  plugin,
  messages: {
    unauthorized: unauthorizedMessageText
  }
};
