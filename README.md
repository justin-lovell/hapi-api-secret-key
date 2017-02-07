[![Build Status](https://travis-ci.org/justin-lovell/hapi-api-secret-key.svg?branch=master)](https://travis-ci.org/justin-lovell/hapi-api-secret-key)

About
=====
The use case that this HAPI plugin solves is simple: given a simple set of API keys,
requests made to the routes marked as "api" should be protected with only the listed
API keys.

This allows the API to be hosted behind an API Manager so that key rotation may occur.


Implemented Rules
----
This is a HAPI plugin which acts as a middleware. The following logic has been defined to keep your services secured.

1. If API secret keys are defined, only allow requests with API keys which match the configuration.
2. If no API secret keys are defined, only accept requests from localhost.
3. Only routes tagged with "api" will have the above rules applied to them by the middleware.

 
Getting Started
-----------------
Simply install the package.

```bash
npm install hapi-api-secret-key
```

Then configure your HAPI server to employ the plugin with the following configuration options

```javascript
var server = new Hapi.Server();

// ... usual stuff

var configOptions = {
  secrets: ['secret', 'secret2']
};

server.register(
  {
    register: ProtectApiPlugin.plugin,
    options: pluginOptions
  },
  function (err, done) {
    if (err) {
      throw err;
    }
    
    server.start(done);
  }
);
```
