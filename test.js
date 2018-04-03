'use strict';

require('mocha');
const Assert = require('assert');

const Hapi = require('hapi');
const ProtectApiPlugin = require('./index');

describe('protect-api', () => {

  const ping123 = {method: 'GET', url: '/ping/123'};
  const greetName = {method: 'GET', url: '/protected/name'};

  const startServer = async (server, pluginOptions) => {
    await server.route({
      method: 'GET',
      path: '/ping/{ping}',
      handler: (request, h) => {
        return h.response({pong: request.params.ping});
      }
    });

    await server.route({
      method: 'GET',
      path: '/protected/{name}',
      handler: (request, h) => {
        return h.response({name: request.params.name});
      },
      config: {
        tags: ['api']
      }
    });

    await server.register(
      {
        plugin: ProtectApiPlugin.plugin,
        options: pluginOptions
      }
    );

    await server.start();
  };


  describe('when the configuration has not been set', () => {

    let remoteServer = null;
    let localhostServer = null;

    before(() => {
        remoteServer = new Hapi.Server({host: process.env.HOSTNAME});
        return startServer(remoteServer, null);
    });

    before(() => {
        localhostServer = new Hapi.Server({host: 'localhost'});
        return startServer(localhostServer, null);
    });

    after(() => remoteServer.stop());
    after(() => localhostServer.stop());

    describe('when accessing from localhost', () => {

      it('GET ' + greetName.url + ' | Respond pong:123 -> 200', async () => {
        const response = await localhostServer.inject(ping123);
        Assert.equal(response.statusCode, 200);
        Assert.equal(response.result.pong, '123');
      });

      it('GET ' + greetName.url + ' | Respond pong:123 -> 200', async () => {
        const response = await localhostServer.inject(greetName);
        Assert.equal(response.statusCode, 200);
        Assert.equal(response.result.name, 'name');
      });
    });

    describe('when accessing from remote server', () => {

      it('GET ' + greetName.url + ' | Respond pong:123 -> 200', async () => {
          const response = await remoteServer.inject(ping123);
          Assert.equal(response.statusCode, 200);
          Assert.equal(response.result.pong, '123');
      });

      it('GET ' + greetName.url + ' | Respond pong:123 -> 401', async () => {
          const response = await remoteServer.inject(greetName);
          Assert.equal(response.statusCode, 401);
          Assert.equal(response.result.message, ProtectApiPlugin.messages.unauthorized);
      });

    });

  });


  describe('when the configuration has been set', () => {

    let remoteServer = null;
    let localhostServer = null;
    const configOptions = {
      secrets: ['secret', 'secret2']
    };

    before(() => {
      remoteServer = new Hapi.Server({host: process.env.HOSTNAME});
      return startServer(remoteServer, configOptions);
    });
    before(() => {
      localhostServer = new Hapi.Server({host: 'localhost'});
      return startServer(localhostServer, configOptions);
    });

    after(() => remoteServer.stop());
    after(() => localhostServer.stop());

    it('GET ' + greetName.url + '| Respond pong:123 -> 200', async () => {
      const response = await remoteServer.inject(ping123);
      Assert.equal(response.statusCode, 200);
      Assert.equal(response.result.pong, '123');
    });

    describe('requests are made with the correct token set', () => {

      describe('when accessing from localhost', () => {

        it('GET ' + greetName.url + ' with HEADER | Respond pong:123 -> 200', async () => {
          const response = await localhostServer.inject(Object.assign({}, greetName, {headers: {'api-key': 'secret'}}));
          Assert.equal(response.statusCode, 200);
          Assert.equal(response.result.name, 'name');
        });

        it('GET ' + greetName.url + '?api-key=secret | Respond pong:123 -> 200', async () => {
          const response = await localhostServer.inject(Object.assign({}, greetName, {url: greetName.url + '?api-key=secret'}));
          Assert.equal(response.statusCode, 200);
          Assert.equal(response.result.name, 'name');
        });

        it('GET ' + greetName.url + '?api-key=secret2 | Respond pong:123 -> 200', async () => {
          const response = await localhostServer.inject(Object.assign({}, greetName, {url: greetName.url + '?api-key=secret2'}));
          Assert.equal(response.statusCode, 200);
          Assert.equal(response.result.name, 'name');
        });
      });

      describe('when accessing from remote server', () => {

        it('GET ' + greetName.url + ' with HEADER | Respond pong:123 -> 200', async () => {
          const response = await localhostServer.inject(Object.assign({}, greetName, {headers: {'api-key': 'secret'}}));
          Assert.equal(response.statusCode, 200);
          Assert.equal(response.result.name, 'name');
        });

        it('GET ' + greetName.url + '?api-key=secret | Respond pong:123 -> 200', async () => {
          const response = await localhostServer.inject(Object.assign({}, greetName, {url: greetName.url + '?api-key=secret'}));
          Assert.equal(response.statusCode, 200);
          Assert.equal(response.result.name, 'name');
        });

        it('GET ' + greetName.url + '?api-key=secret2 | Respond pong:123 -> 200', async () => {
          const response = await localhostServer.inject(Object.assign({}, greetName, {url: greetName.url + '?api-key=secret2'}));
          Assert.equal(response.statusCode, 200);
          Assert.equal(response.result.name, 'name');
        });

      });

    });


    describe('requests are made with the incorrect token set', async () => {

      describe('when accessing from localhost', async () => {

        it('GET ' + greetName.url + ' with HEADER | Respond pong:123 -> 401', async () => {
          const response = await localhostServer.inject(Object.assign({}, greetName, {headers: {'api-key': 'wrong'}}))
            .then(function (response) {
              Assert.equal(response.statusCode, 401);
              Assert.equal(response.result.message, ProtectApiPlugin.messages.unauthorized);
            })
        });

        it('GET ' + greetName.url + '?api-key=wrong | Respond pong:123 -> 401', async () => {
          const response = await localhostServer.inject(Object.assign({}, greetName, {url: greetName.url + '?api-key=wrong'}))
            .then(function (response) {
              Assert.equal(response.statusCode, 401);
              Assert.equal(response.result.message, ProtectApiPlugin.messages.unauthorized);
            })
        });

      });


      describe('when accessing from remote server', async () => {

        it('GET ' + greetName.url + ' with HEADER | Respond pong:123 -> 401', async () => {
          const response = await localhostServer.inject(Object.assign({}, greetName, {headers: {'api-key': 'wrong'}}))
            .then(function (response) {
              Assert.equal(response.statusCode, 401);
              Assert.equal(response.result.message, ProtectApiPlugin.messages.unauthorized);
            })
        });

        it('GET ' + greetName.url + '?api-key=wrong | Respond pong:123 -> 401', async () => {
          const response = await localhostServer.inject(Object.assign({}, greetName, {url: greetName.url + '?api-key=wrong'}))
            .then(function (response) {
              Assert.equal(response.statusCode, 401);
              Assert.equal(response.result.message, ProtectApiPlugin.messages.unauthorized);
            })
        });

      });

    });


    describe('requests are made without token set', async () => {

      describe('when accessing from localhost', async () => {

        it('GET ' + greetName.url + ' | Respond pong:123 -> 401', async () => {
          const response = await localhostServer.inject(greetName)
            .then(function (response) {
              Assert.equal(response.statusCode, 401);
              Assert.equal(response.result.message, ProtectApiPlugin.messages.unauthorized);
            })
        });

      });


      describe('when accessing from remote server', async () => {


        it('GET ' + greetName.url + ' | Respond pong:123 -> 401', async () => {
          const response = await remoteServer.inject(greetName)
            .then(function (response) {
              Assert.equal(response.statusCode, 401);
              Assert.equal(response.result.message, ProtectApiPlugin.messages.unauthorized);
            })
        });

      });

    });

  });


  describe('when the process environment variables are set', async () => {

    let remoteServer = null;
    let localhostServer = null;
    
    before(async () => {
        process.env['API_KEY_1'] = 'secret';
        process.env['API_KEY_2'] = 'secret2';
      }
    );

    before(() => {
      remoteServer = new Hapi.Server({host: process.env.HOSTNAME});
      return startServer(remoteServer);
    });
    before(() => {
      localhostServer = new Hapi.Server({host: 'localhost'});
      return startServer(localhostServer);
    });

    after(() => remoteServer.stop());
    after(() => localhostServer.stop());

    it('GET ' + greetName.url + '| Respond pong:123 -> 200', async () => {
      const response = await remoteServer.inject(ping123)
      Assert.equal(response.statusCode, 200);
      Assert.equal(response.result.pong, '123');
    })


    describe('requests are made with the correct token set', () => {

      describe('when accessing from localhost', () => {

          it('GET ' + greetName.url + ' with HEADER | Respond pong:123 -> 200', async () => {
            const response = await localhostServer.inject(Object.assign({}, greetName, {headers: {'api-key': 'secret'}}))
            Assert.equal(response.statusCode, 200);
            Assert.equal(response.result.name, 'name');
          })

          it('GET ' + greetName.url + '?api-key=secret | Respond pong:123 -> 200', async () => {
            const response = await localhostServer.inject(Object.assign({}, greetName, {url: greetName.url + '?api-key=secret'}))
            Assert.equal(response.statusCode, 200);
            Assert.equal(response.result.name, 'name');
          });

          it('GET ' + greetName.url + '?api-key=secret2 | Respond pong:123 -> 200', async () => {
            const response = await localhostServer.inject(Object.assign({}, greetName, {url: greetName.url + '?api-key=secret2'}))
            Assert.equal(response.statusCode, 200);
            Assert.equal(response.result.name, 'name');
          });
      });

      describe('when accessing from remote server', () => {

        it('GET ' + greetName.url + ' with HEADER | Respond pong:123 -> 200', async () => {
          const response = await localhostServer.inject(Object.assign({}, greetName, {headers: {'api-key': 'secret'}}))
              Assert.equal(response.statusCode, 200);
              Assert.equal(response.result.name, 'name');
            });
        });

        it('GET ' + greetName.url + '?api-key=secret | Respond pong:123 -> 200', async () => {
          const response = await localhostServer.inject(Object.assign({}, greetName, {url: greetName.url + '?api-key=secret'}))
          Assert.equal(response.statusCode, 200);
          Assert.equal(response.result.name, 'name');
        });

        it('GET ' + greetName.url + '?api-key=secret2 | Respond pong:123 -> 200', async () => {
          const response = await localhostServer.inject(Object.assign({}, greetName, {url: greetName.url + '?api-key=secret2'}))
          Assert.equal(response.statusCode, 200);
          Assert.equal(response.result.name, 'name');
        });

      });


    describe('requests are made with the incorrect token set', () => {

      describe('when accessing from localhost', () => {

        it('GET ' + greetName.url + ' with HEADER | Respond pong:123 -> 401', async () => {
          const response = await localhostServer.inject(Object.assign({}, greetName, {headers: {'api-key': 'wrong'}}))
          Assert.equal(response.statusCode, 401);
          Assert.equal(response.result.message, ProtectApiPlugin.messages.unauthorized);
        });

        it('GET ' + greetName.url + '?api-key=wrong | Respond pong:123 -> 401', async () => {
          const response = await localhostServer.inject(Object.assign({}, greetName, {url: greetName.url + '?api-key=wrong'}))
          Assert.equal(response.statusCode, 401);
          Assert.equal(response.result.message, ProtectApiPlugin.messages.unauthorized);
        });

      });


      describe('when accessing from remote server', () => {

        it('GET ' + greetName.url + ' with HEADER | Respond pong:123 -> 401', async () => {
          const response = await localhostServer.inject(Object.assign({}, greetName, {headers: {'api-key': 'wrong'}}));
          Assert.equal(response.statusCode, 401);
          Assert.equal(response.result.message, ProtectApiPlugin.messages.unauthorized);
        });

        it('GET ' + greetName.url + '?api-key=wrong | Respond pong:123 -> 401', async () => {
          const response = await localhostServer.inject(Object.assign({}, greetName, {url: greetName.url + '?api-key=wrong'}))
          Assert.equal(response.statusCode, 401);
          Assert.equal(response.result.message, ProtectApiPlugin.messages.unauthorized);
        });

      });

    });


    describe('requests are made without token set', () => {

      describe('when accessing from localhost', () => {

        it('GET ' + greetName.url + ' | Respond pong:123 -> 401', async () => {
          const response = await localhostServer.inject(greetName);
          Assert.equal(response.statusCode, 401);
          Assert.equal(response.result.message, ProtectApiPlugin.messages.unauthorized);
        });

      });


      describe('when accessing from remote server', () => {

        it('GET ' + greetName.url + ' | Respond pong:123 -> 401', async () => {
          const response = await remoteServer.inject(greetName);
          Assert.equal(response.statusCode, 401);
          Assert.equal(response.result.message, ProtectApiPlugin.messages.unauthorized);
        });

      });

    });
  });
});


