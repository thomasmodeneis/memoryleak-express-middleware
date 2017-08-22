import memwatch from 'memwatch-next';
import heapdump from 'heapdump';

class MemoryLeakExpressMiddleware {

  constructor(options = {}) {
    // Parse options
    this.middleware = this.middleware.bind(this);
    this.MEMORYLEAK_MIDDLEWARE_ENABLED = /true/.test(options.MEMORYLEAK_MIDDLEWARE_ENABLED);
    this.logger = options.logger || console;
    this.routes = options.routes;
    this.routeName = options.routeName || 'memoryleak';
    this.routeNameDump = options.routeNameDump || 'memoryleak-dump';
    this.routeNameFileDump = options.routeNameFileDump || 'memoryleak-file-dump';
    this.monitorLeaks = options.monitorLeaks || this.monitorLeaks;
    this.secret = options.secret;
    this.heapdiff = null;
    this.hasDumped = false;
    this.lastDump = null;

    this.monitorLeaks();
  }

  monitorLeaks() {
    if (this.MEMORYLEAK_MIDDLEWARE_ENABLED) {
      memwatch.on('leak', (info) => {
        this.logger.warn('MemoryLeak-Express-Middleware detected possible leak -> ', info);
      });
    }
  }


  // Middleware
  middleware() {

    /**
     * This endpoint will process a Dump Diff, if there the dump was not yet processed, it will create a new one and dump diff right after.
     */
    this.routes.get(`/${this.routeName}`, (req, res) => {
      let secret = req.query.secret;
      if (secret !== this.secret) {
        // Send 404 in order to avoid giving internal info about endpoints
        return res.sendStatus(404);
      }
      if (this.MEMORYLEAK_MIDDLEWARE_ENABLED) {
        // if no dump was taken, do it now
        if (!this.heapdiff || this.hasDumped) {
          this.heapdiff = new memwatch.HeapDiff();
          this.lastDump = new Date();
        }
        //calculate elapsed seconds from the dump
        const now = new Date().getTime();
        let diffElapsedSeconds = Math.round((now - this.lastDump.getTime()) / 1000);
        this.hasDumped = true;
        //return the leak stats
        return res.send({
          heapdiff: this.heapdiff.end(),
          lastDump: this.lastDump,
          diffElapsedSeconds: diffElapsedSeconds,
        });
      }
      //return just the JSON indication of the current status -> disabled
      return res.send({ MEMORYLEAK_MIDDLEWARE_ENABLED: this.MEMORYLEAK_MIDDLEWARE_ENABLED, lastDump: this.lastDump });
    });

    /**
     * This endpoint will process a new dump, every time this endpoint is called, a new Dump will be processed.
     */
    this.routes.get(`/${this.routeNameDump}`, (req, res) => {
      let secret = req.query.secret;
      if (secret !== this.secret) {
        // Send 404 in order to avoid giving internal info about endpoints
        return res.sendStatus(404);
      }
      if (this.MEMORYLEAK_MIDDLEWARE_ENABLED) {
        //reset the current dump to now
        this.heapdiff = new memwatch.HeapDiff();
        this.lastDump = new Date();
        this.hasDumped = false;
      }
      return res.send({
        MEMORYLEAK_MIDDLEWARE_ENABLED: this.MEMORYLEAK_MIDDLEWARE_ENABLED,
        lastDump: this.lastDump
      });
    })

    /**
     * This endpoint will generate a new file dump, every time this endpoint is called.
     */
    this.routes.get(`/${this.routeNameFileDump}`, (req, res) => {
      let secret = req.query.secret;
      if (secret !== this.secret) {
        // Send 404 in order to avoid giving internal info about endpoints
        return res.sendStatus(404);
      }
      if (this.MEMORYLEAK_MIDDLEWARE_ENABLED) {
        const filename = `/var/local/heapdump-${Date.now()}.heapsnapshot`;
        heapdump.writeSnapshot(filename, function (err, filename) {
          return res.send({
            MEMORYLEAK_MIDDLEWARE_ENABLED: this.MEMORYLEAK_MIDDLEWARE_ENABLED,
            lastDump: `V8 Memory Dump written to ${filename}`
          });
        });
      } else {
        // not enabled, return empty hands
        return res.send({
          MEMORYLEAK_MIDDLEWARE_ENABLED: this.MEMORYLEAK_MIDDLEWARE_ENABLED
        });
      }
    })
  }

}

module.exports = MemoryLeakExpressMiddleware;
