const chai = require('chai');
chai.use(require('chai-string'));
const should = chai.should();

const request = require('request');
const express = require('express');

const MemoryLeakExpressMiddleware = require('../src/index');

const PORT = process.env.PORT || 16789;

describe('MemoryLeak Express Middleware', () => {
  let routes = null;
  let server = null;
  beforeEach((done) => {
    routes = express();
    routes.get('/', (req, res) => {
      res.writeHead(200);
      res.end('All done');
    });

    server = routes.listen(PORT, (err) => {
      if (err) {
        console.log("Got error when starting", err);
        done(err);
      }
      console.log("App started port ", PORT);
      done();
    });

  });

  afterEach((done) => {
    server.close();
    setTimeout(() => {
      routes = null;
      done()
    })
  });

  it('Should start with 200 and respond with a dump when hitting /memoryleak using a secret=test', (done) => {

    new MemoryLeakExpressMiddleware({
      MEMORYLEAK_MIDDLEWARE_ENABLED: true,
      routes: routes,
      secret: "test"
    }).middleware();

    request.get(`http://localhost:${PORT}/`, (err, response) => {
      should.not.exist(err);
      response.statusCode.should.equal(200);


      request.get('http://localhost:16789/memoryleak?secret=test', (err, res, body) => {
        should.not.exist(err);
        res.statusCode.should.equal(200);
        const json = JSON.parse(body);

        should.exist(json.heapdiff);
        should.exist(json.lastDump);
        should.exist(json.diffElapsedSeconds);

        done();
      });

    });

  });


  it('Should start with 200 and respond with a dump of 5s when hitting /memoryleak-dump followed by /memoryleak and use secret=test123', (done) => {

    new MemoryLeakExpressMiddleware({
      MEMORYLEAK_MIDDLEWARE_ENABLED: true,
      routes: routes,
      secret: "test123"
    }).middleware();

    request.get(`http://localhost:${PORT}/`, (err, response) => {
      should.not.exist(err);
      response.statusCode.should.equal(200);


      request.get('http://localhost:16789/memoryleak-dump?secret=test123', (err, res, body) => {
        should.not.exist(err);
        res.statusCode.should.equal(200);
        const json = JSON.parse(body);

        should.exist(json.MEMORYLEAK_MIDDLEWARE_ENABLED);
        should.exist(json.lastDump);

        setTimeout(() => {
          request.get('http://localhost:16789/memoryleak?secret=test123', (err2, res2, body2) => {
            should.not.exist(err2);
            res2.statusCode.should.equal(200);
            const json = JSON.parse(body2);

            should.exist(json.heapdiff);
            should.exist(json.lastDump);
            should.exist(json.diffElapsedSeconds);
            json.diffElapsedSeconds.should.equal(5);

            done();
          })
        }, 5000);

      });

    });

  });


  it('Should start with 200 and respond with a dump followed by another dump and should not break things using no secret', (done) => {

    new MemoryLeakExpressMiddleware({
      MEMORYLEAK_MIDDLEWARE_ENABLED: true,
      routes: routes
    }).middleware();

    request.get(`http://localhost:${PORT}/`, (err, response) => {
      should.not.exist(err);
      response.statusCode.should.equal(200);


      request.get('http://localhost:16789/memoryleak', (err, res, body) => {
        should.not.exist(err);
        res.statusCode.should.equal(200);
        const json = JSON.parse(body);

        should.exist(json.heapdiff);
        should.exist(json.lastDump);
        should.exist(json.diffElapsedSeconds);
        json.diffElapsedSeconds.should.equal(0);

        setTimeout(() => {
          request.get('http://localhost:16789/memoryleak', (err2, res2, body2) => {
            should.not.exist(err2);
            res2.statusCode.should.equal(200);
            const json = JSON.parse(body2);

            should.exist(json.heapdiff);
            should.exist(json.lastDump);
            should.exist(json.diffElapsedSeconds);
            json.diffElapsedSeconds.should.equal(0);

            done();
          })
        }, 5000);

      });

    });

  });


  it('Should start with 200 and respond with a 404 when using wrong secret', (done) => {

    new MemoryLeakExpressMiddleware({
      MEMORYLEAK_MIDDLEWARE_ENABLED: true,
      routes: routes,
      secret: 'test321'
    }).middleware();

    request.get(`http://localhost:${PORT}/`, (err, response) => {
      should.not.exist(err);
      response.statusCode.should.equal(200);


      request.get('http://localhost:16789/memoryleak', (err2, res2) => {
        should.not.exist(err2);
        res2.statusCode.should.equal(404);

        setTimeout(() => {
          request.get('http://localhost:16789/memoryleak?secret=test123', (err3, res3) => {
            should.not.exist(err3);
            res3.statusCode.should.equal(404);

            request.get('http://localhost:16789/memoryleak?secret=test123', (err4, res4) => {
              should.not.exist(err4);
              res4.statusCode.should.equal(404);
              done();
            });
          });
        }, 1000);

      });

    });

  });


  it('Filedump - Should start with 200 and respond with a 200 when using wrong secret', (done) => {

    new MemoryLeakExpressMiddleware({
      MEMORYLEAK_MIDDLEWARE_ENABLED: true,
      routes: routes,
      secret: 'test321'
    }).middleware();

    request.get(`http://localhost:${PORT}/`, (err, response) => {
      should.not.exist(err);
      response.statusCode.should.equal(200);


      request.get('http://localhost:16789/memoryleak-file-dump', (err2, res2) => {
        should.not.exist(err2);
        res2.statusCode.should.equal(404);

        setTimeout(() => {
          request.get('http://localhost:16789/memoryleak-file-dump?secret=test321', (err4, res4, body2) => {
            should.not.exist(err4);
            res4.statusCode.should.equal(200);
            const json = JSON.parse(body2);

            should.exist(json.lastDump);
            json.lastDump.should.startWith('V8 Memory Dump written to ');
            done();
          });
        });
      }, 1000);

    });

  });


});
