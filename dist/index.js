'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _memwatchNext = require('memwatch-next');

var _memwatchNext2 = _interopRequireDefault(_memwatchNext);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MemoryLeakExpressMiddleware = function () {
  function MemoryLeakExpressMiddleware() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, MemoryLeakExpressMiddleware);

    // Parse options
    this.middleware = this.middleware.bind(this);
    this.MEMORYLEAK_MIDDLEWARE_ENABLED = /true/.test(options.MEMORYLEAK_MIDDLEWARE_ENABLED);
    this.logger = options.logger || console;
    this.routes = options.routes;
    this.routeName = options.routeName || 'memoryleak';
    this.routeNameDump = options.routeNameDump || 'memoryleak-dump';
    this.monitorLeaks = options.monitorLeaks || this.monitorLeaks;
    this.secret = options.secret;
    this.heapdiff = null;
    this.hasDumped = false;
    this.lastDump = null;

    this.monitorLeaks();
  }

  _createClass(MemoryLeakExpressMiddleware, [{
    key: 'monitorLeaks',
    value: function monitorLeaks() {
      var _this = this;

      if (this.MEMORYLEAK_MIDDLEWARE_ENABLED) {
        _memwatchNext2.default.on('leak', function (info) {
          _this.logger.warn('MemoryLeak-Express-Middleware detected possible leak -> ', info);
        });
      }
    }

    // Middleware

  }, {
    key: 'middleware',
    value: function middleware() {
      var _this2 = this;

      /**
       * This endpoint will process a Dump Diff, if there the dump was not yet processed, it will create a new one and dump diff right after.
       */
      this.routes.get('/' + this.routeName, function (req, res) {
        var secret = req.query.secret;
        if (_this2.MEMORYLEAK_MIDDLEWARE_ENABLED && secret === _this2.secret) {
          // if no dump was taken, do it now
          if (!_this2.heapdiff || _this2.hasDumped) {
            _this2.heapdiff = new _memwatchNext2.default.HeapDiff();
            _this2.lastDump = new Date();
          }
          //calculate elapsed seconds from the dump
          var now = new Date().getTime();
          var diffElapsedSeconds = Math.round((now - _this2.lastDump.getTime()) / 1000);
          _this2.hasDumped = true;
          //return the leak stats
          return res.send({
            heapdiff: _this2.heapdiff.end(),
            lastDump: _this2.lastDump,
            diffElapsedSeconds: diffElapsedSeconds
          });
        }
        //return just the JSON indication of the current status -> disabled
        return res.send({ MEMORYLEAK_MIDDLEWARE_ENABLED: _this2.MEMORYLEAK_MIDDLEWARE_ENABLED, lastDump: _this2.lastDump });
      });

      /**
       * This endpoint will process a new dump, every time this endpoint is called, a new Dump will be processed.
       */
      this.routes.get('/' + this.routeNameDump, function (req, res) {
        var secret = req.query.secret;
        if (_this2.MEMORYLEAK_MIDDLEWARE_ENABLED && secret === _this2.secret) {
          //reset the current dump to now
          _this2.heapdiff = new _memwatchNext2.default.HeapDiff();
          _this2.lastDump = new Date();
          _this2.hasDumped = false;
        }
        return res.send({
          MEMORYLEAK_MIDDLEWARE_ENABLED: _this2.MEMORYLEAK_MIDDLEWARE_ENABLED,
          lastDump: _this2.lastDump
        });
      });
    }
  }]);

  return MemoryLeakExpressMiddleware;
}();

module.exports = MemoryLeakExpressMiddleware;