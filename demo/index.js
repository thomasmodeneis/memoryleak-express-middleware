const express = require('express');
const MemoryLeakExpressMiddleware = require('../src/index');

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
