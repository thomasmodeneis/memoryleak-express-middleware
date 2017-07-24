const should = require('chai').should();
const request = require('request');
const express = require('express');

const MemoryLeakExpressMiddleware = require('../src/index');

const PORT = process.env.PORT || 16789;

describe('MemoryLeak Express Middleware', () => {
  let routes = express();
  let server = null;
  before((done) => {

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

  after((done) => {
    server.close();
    routes = null;
    done()
  });

  it('Should start with 200 and respond with a dump when hitting /memoryleak', (done) => {

    new MemoryLeakExpressMiddleware({
      MEMORYLEAK_MIDDLEWARE_ENABLED: true,
      routes: routes
    }).middleware();

    request.get(`http://localhost:${PORT}/`, (err, response) => {
      should.not.exist(err);
      response.statusCode.should.equal(200);


      request.get('http://localhost:16789/memoryleak', (err, res, body) => {
        should.not.exist(err);
        response.statusCode.should.equal(200);
        const json = JSON.parse(body);

        should.exist(json.heapdiff);
        should.exist(json.lastDump);
        should.exist(json.diffElapsedSeconds);

        done();
      });

    });

  });


  it('Should start with 200 and respond with a dump of 5s when hitting /memoryleak-dump followed by /memoryleak', (done) => {

    new MemoryLeakExpressMiddleware({
      MEMORYLEAK_MIDDLEWARE_ENABLED: true,
      routes: routes
    }).middleware();

    request.get(`http://localhost:${PORT}/`, (err, response) => {
      should.not.exist(err);
      response.statusCode.should.equal(200);


      request.get('http://localhost:16789/memoryleak-dump', (err, res, body) => {
        should.not.exist(err);
        response.statusCode.should.equal(200);
        const json = JSON.parse(body);

        should.exist(json.MEMORYLEAK_MIDDLEWARE_ENABLED);
        should.exist(json.lastDump);

        setTimeout(() => {
          request.get('http://localhost:16789/memoryleak', (err, res, body) => {
            should.not.exist(err);
            response.statusCode.should.equal(200);
            const json = JSON.parse(body);

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


  it('Should start with 200 and respond with a dump followed by another dump and should not break things', (done) => {

    new MemoryLeakExpressMiddleware({
      MEMORYLEAK_MIDDLEWARE_ENABLED: true,
      routes: routes
    }).middleware();

    request.get(`http://localhost:${PORT}/`, (err, response) => {
      should.not.exist(err);
      response.statusCode.should.equal(200);


      request.get('http://localhost:16789/memoryleak', (err, res, body) => {
        should.not.exist(err);
        response.statusCode.should.equal(200);
        const json = JSON.parse(body);

        should.exist(json.heapdiff);
        should.exist(json.lastDump);
        should.exist(json.diffElapsedSeconds);
        json.diffElapsedSeconds.should.equal(0);

        setTimeout(() => {
          request.get('http://localhost:16789/memoryleak', (err, res, body) => {
            should.not.exist(err);
            response.statusCode.should.equal(200);
            const json = JSON.parse(body);

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


});
