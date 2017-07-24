# MemoryLeak detector Middleware for Express with ES6

This module is a easy way to setup Memory Leak Detector as a middleware on your project, so that you can hit a specific endpoint and retrieve the a digested Memory Leak Dump output out of it, on demand, when you want it.
This will help you to identify possible leaks on your app and avoid having memory leaks on your applications.

# How does it work?
This module was designed to be a thin wrapper around memwatch-next and enable you to plug it into your existing ExpressJS app. 

See the below UML diagram for a complete architecture view:

Implementation example:

```
const express = require('express');
const MemoryLeakExpressMiddleware = require('memoryleak-express-middleware');

const MEMORYLEAK_MIDDLEWARE_ENABLED = process.env.MEMORYLEAK_MIDDLEWARE_ENABLED;

const PORT = process.env.PORT || 16789;
const routes = express();

new MemoryLeakExpressMiddleware({MEMORYLEAK_MIDDLEWARE_ENABLED:MEMORYLEAK_MIDDLEWARE_ENABLED, routes:routes}).middleware();

routes.get('/', (req, res) => {
  res.writeHead(200);
  res.end('All done');
});

routes.listen(PORT, function (err) {
  if (err) {
    console.log("Got error when starting", err);
    process.exit(1);
  }
  console.log("App started port ", PORT);
});

```


# Options:
* The constructor enables you to provide options as arguments, and customize the behaviour of this module:
1) MEMORYLEAK_MIDDLEWARE_ENABLED, set to false to disable. Default: false.
2) logger, set your custom logger if you want. Default console.
3) routes, set here your express app routes. Default null. Field required.
4) routeName, set here the endpoint name you would like to set for getting dump diff. Default /memoryleak
5) routeNameDump, set the endpoint name you would like to set for starting a new dump. Default /memoryleak-dump
6) monitorLeaks, this will listen to leak events on memwatch. Useful if you would like to set leak events as errors, or if you would like to do anything else with it. Default: will log memory leaks as WARN.


## Author
* Thomas Modeneis
* [StackOverflow](https://careers.stackoverflow.com/thomasmodeneis)
* [LinkedIn](https://uk.linkedin.com/in/thomasmodeneis)

License
=======

This module is licensed under the MIT license.