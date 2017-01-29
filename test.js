'use strict';

require('mocha');
var Assert = require('assert');


var Hapi = require('hapi');

var ProtectApiPlugin = require('./index');


describe('protect-api', function () {

  var ping123 = {method: 'GET', url: '/ping/123'};
  var greetName = {method: 'GET', url: '/protected/name'};


  function startServer(server, pluginOptions, done) {

    server.route({
      method: 'GET',
      path: '/ping/{ping}',
      handler: function (request, reply) {
        reply({
          pong: request.params.ping
        })
      }
    });

    server.route({
      method: 'GET',
      path: '/protected/{name}',
      handler: function (request, reply) {
        reply({
          name: request.params.name
        });
      },
      config: {
        tags: ['api']
      }
    });


    server.register(
      {
        register: ProtectApiPlugin.plugin,
        options: pluginOptions
      },
      function () {
        server.start(done);
      }
    );

  };


  describe('when the configuration has not been set', function () {

    var remoteServer = null;
    var localhostServer = null;

    before(function (done) {
        remoteServer = new Hapi.Server();
        remoteServer.connection({host: process.env.HOSTNAME});

        startServer(remoteServer, null, done);
      }
    );
    before(function (done) {
        localhostServer = new Hapi.Server();
        localhostServer.connection({host: 'localhost'});

        startServer(localhostServer, null, done);
      }
    );

    after(function (done) {
      remoteServer.stop(done);
    });
    after(function (done) {
      localhostServer.stop(done);
    });


    describe('when accessing from localhost', function () {


      it('GET ' + greetName.url + ' | Respond pong:123 -> 200', function () {
        return localhostServer.inject(ping123)
          .then(function (response) {
            Assert.equal(response.statusCode, 200);
            Assert.equal(response.result.pong, '123');
          })
      });

      it('GET ' + greetName.url + ' | Respond pong:123 -> 200', function () {
          return localhostServer.inject(greetName)
            .then(function (response) {
              Assert.equal(response.statusCode, 200);
              Assert.equal(response.result.name, 'name');
            });
        }
      );

    });


    describe('when accessing from remote server', function () {

      it('GET ' + greetName.url + ' | Respond pong:123 -> 401', function () {
          return remoteServer.inject(ping123)
            .then(function (response) {
              Assert.equal(response.statusCode, 200);
              Assert.equal(response.result.pong, '123');
            });
        }
      );

      it('GET ' + greetName.url + ' | Respond pong:123 -> 401', function () {
          return remoteServer.inject(greetName)
            .then(function (response) {
              Assert.equal(response.statusCode, 401);
              Assert.equal(response.result.message, ProtectApiPlugin.messages.unauthorized);
            });
        }
      );

    });

  });


  describe('when the configuration has been set', function () {

    var remoteServer = null;
    var localhostServer = null;
    var configOptions = {
      secrets: ['secret']
    };

    before(function (done) {
        remoteServer = new Hapi.Server();
        remoteServer.connection({host: process.env.HOSTNAME});

        startServer(remoteServer, configOptions, done);
      }
    );
    before(function (done) {
        localhostServer = new Hapi.Server();
        localhostServer.connection({host: 'localhost'});

        startServer(localhostServer, configOptions, done);
      }
    );

    after(function (done) {
      remoteServer.stop(done)
    });
    after(function (done) {
      localhostServer.stop(done)
    });


    it('GET ' + greetName.url + '| Respond pong:123 -> 200', function () {
        return remoteServer.inject(ping123)
          .then(function (response) {
            Assert.equal(response.statusCode, 200);
            Assert.equal(response.result.pong, '123');
          })
      }
    );


    describe('requests are made with the correct token set', function () {

      describe('when accessing from localhost', function () {

          it('GET ' + greetName.url + ' with HEADER | Respond pong:123 -> 200', function () {
              return localhostServer.inject(Object.assign(greetName, {headers: {'api-key': 'secret'}}))
                .then(function (response) {
                  Assert.equal(response.statusCode, 200);
                  Assert.equal(response.result.name, 'name');
                })
            }
          );

          it('GET ' + greetName.url + '?api-key=secret | Respond pong:123 -> 200', function () {
              return localhostServer.inject(Object.assign(greetName, {url: greetName.url + '?api-key=secret'}))
                .then(function (response) {
                  Assert.equal(response.statusCode, 200);
                  Assert.equal(response.result.name, 'name');
                });
            }
          );

          it('GET ' + greetName.url + '?api-key=secret2 | Respond pong:123 -> 200', function () {
              return localhostServer.inject(Object.assign(greetName, {url: greetName.url + '?api-key=secret2'}))
                .then(function (response) {
                  Assert.equal(response.statusCode, 200);
                  Assert.equal(response.result.name, 'name');
                });
            }
          );

        }
      );


      describe('when accessing from remote server', function () {

        it('GET ' + greetName.url + ' with HEADER | Respond pong:123 -> 200', function () {
          return localhostServer.inject(Object.assign(greetName, {headers: {'api-key': 'secret'}}))
            .then(function (response) {
              Assert.equal(response.statusCode, 200);
              Assert.equal(response.result.name, 'name');
            });
        });

        it('GET ' + greetName.url + '?api-key=secret | Respond pong:123 -> 200', function () {
          return localhostServer.inject(Object.assign(greetName, {url: greetName.url + '?api-key=secret'}))
            .then(function (response) {
              Assert.equal(response.statusCode, 200);
              Assert.equal(response.result.name, 'name');
            });
        });

        it('GET ' + greetName.url + '?api-key=secret2 | Respond pong:123 -> 200', function () {
          return localhostServer.inject(Object.assign(greetName, {url: greetName.url + '?api-key=secret2'}))
            .then(function (response) {
                Assert.equal(response.statusCode, 200);
                Assert.equal(response.result.name, 'name');
              }
            );
        });

      });

    });


    describe('requests are made with the incorrect token set', function () {

      describe('when accessing from localhost', function () {

        it('GET ' + greetName.url + ' with HEADER | Respond pong:123 -> 401', function () {
          return localhostServer.inject(Object.assign(greetName, {headers: {'api-key': 'wrong'}}))
            .then(function (response) {
              Assert.equal(response.statusCode, 401);
              Assert.equal(response.result.message, ProtectApiPlugin.messages.unauthorized);
            })
        });

        it('GET ' + greetName.url + '?api-key=wrong | Respond pong:123 -> 401', function () {
          return localhostServer.inject(Object.assign(greetName, {url: greetName.url + '?api-key=wrong'}))
            .then(function (response) {
              Assert.equal(response.statusCode, 401);
              Assert.equal(response.result.message, ProtectApiPlugin.messages.unauthorized);
            })
        });

      });


      describe('when accessing from remote server', function () {

        it('GET ' + greetName.url + ' with HEADER | Respond pong:123 -> 401', function () {
          return localhostServer.inject(Object.assign(greetName, {headers: {'api-key': 'wrong'}}))
            .then(function (response) {
              Assert.equal(response.statusCode, 401);
              Assert.equal(response.result.message, ProtectApiPlugin.messages.unauthorized);
            })
        });

        it('GET ' + greetName.url + '?api-key=wrong | Respond pong:123 -> 401', function () {
          return localhostServer.inject(Object.assign(greetName, {url: greetName.url + '?api-key=wrong'}))
            .then(function (response) {
              Assert.equal(response.statusCode, 401);
              Assert.equal(response.result.message, ProtectApiPlugin.messages.unauthorized);
            })
        });

      });

    });


    describe('requests are made without token set', function () {

      describe('when accessing from localhost', function () {

        it('GET ' + greetName.url + ' | Respond pong:123 -> 401', function () {
          return localhostServer.inject(greetName)
            .then(function (response) {
              Assert.equal(response.statusCode, 401);
              Assert.equal(response.result.message, ProtectApiPlugin.messages.unauthorized);
            })
        });

      });


      describe('when accessing from remote server', function () {


        it('GET ' + greetName.url + ' | Respond pong:123 -> 401', function () {
          return remoteServer.inject(greetName)
            .then(function (response) {
              Assert.equal(response.statusCode, 401);
              Assert.equal(response.result.message, ProtectApiPlugin.messages.unauthorized);
            })
        });

      });

    });

  });


});


