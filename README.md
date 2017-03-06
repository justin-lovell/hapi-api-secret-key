[![Build Status](https://travis-ci.org/justin-lovell/hapi-api-secret-key.svg?branch=master)](https://travis-ci.org/justin-lovell/hapi-api-secret-key)

About
=====
The use case that this HAPI plugin solves is simple: given a simple set of API keys,
requests made to the routes marked as "api" should be protected with only the listed
API keys.

This allows the API to be hosted behind an API Manager so that key rotation may occur.


Default Behavior
================
1. API Secrets are usually loaded by the plugin with the following pseudo code:

    ```javascript
    var secrets = [];
    var curr;
    while (curr = process.env['API_KEY_' + (secrets.length + 1)]) {
      secrets.push(curr);
    }
    ```

2. Callee's are responsible for providing the secret either
by the query string or HTTP-header named "api-key"

3. Only the routes which have been decorated with "api" tag will
be protected by this plugin.

In summary, the `hapi-api-secret-key` has two modes which is determined whether
or not secrets are supplied to the plugin. These behaviors are documented as below.

| Secrets loaded? | Allow localhost access? | Allow remote access?                           |
|-----------------|-------------------------|------------------------------------------------|
| No              | Yes                     | No                                             |
| Yes             | No                      | Yes - only if supplied keys match a secret key |
 
 
Quick Start
===========
Simply install the package.

```bash
npm install --save hapi-api-secret-key
```

Then configure your HAPI server to employ the plugin with the following configuration options

```javascript
var server = new Hapi.Server();

server.register(
  // this is where you register all your HAPI plugins
  require('hapi-api-secret-key').plugin,
  function (err) {
    
    if (err) {
      throw err;
    }
    
    server.route({
      method: 'GET',
      path: '/protected/{name}',
      handler: function (request, reply) {
        reply({
          name: request.params.name
        });
      },
      config: {
        // we protect anything with the API tag by default
        tags: ['api']
      }
    });
    
    // below is standard start-up procedure of HAPI servers
    server.start(function(err) {
      
        if (err) {
            throw err;
        }

        console.log('Server running at:', server.info.uri);
      
    });
  }
);
```

Options?
--------
With the above example, there are simple options which could be injected
into the plugin, namely.
* Secrets
* Fetching the user supplied token/secret
* Which routes to protect


```javascript
var server = new Hapi.Server();

// by default, the plugin behaves as the options below
// however, you are able to selectively override the behavior
// of each option
var configOptions = {
  secrets: [
        process.env['API_KEY_1'],
        process.env['API_KEY_2']
        // and so on
    ],
  fetchUserApiKey: function (request) {
         return request.headers["api-key"] || request.query["api-key"];
      },
  shouldApplyApiFilter: function (request) {
        var tags = request.route.settings.tags;
        return tags && tags.indexOf('api') >= 0;
      }
};

server.register(
  // this is where you register all your HAPI plugins
  {
    register: require('hapi-api-secret-key').plugin,
    options: configOptions
  },
  function (err) {
    
    if (err) {
      throw err;
    }
    
    server.route({
      method: 'GET',
      path: '/protected/{name}',
      handler: function (request, reply) {
        reply({
          name: request.params.name
        });
      },
      config: {
        // we protect anything with the API tag by default
        tags: ['api']
      }
    });
    
    // below is standard start-up procedure of HAPI servers
    server.start(function(err) {
      
        if (err) {
            throw err;
        }

        console.log('Server running at:', server.info.uri);
      
    });
  }
);
```

