'use strict';
// Flags: --expose-gc

const common = require('../../common');
const assert = require('assert');
const binding =
  require(`./build/${common.buildType}/test_gc_during_uncaught_exception`);

// Regression test for https://github.com/nodejs/node/issues/67421:
// when the `uncaughtException` handler triggers a gc, finalizers of
// unreachable wrapped objects run synchronously (experimental API). The
// pending exception from the threadsafe function callback must not be
// reported a second time, or the process aborts with a re-entrant
// uncaught exception fatal error.
process.on('uncaughtException', common.mustCall((err) => {
  assert.strictEqual(err.message, 'thrown from call_js_cb');
  global.gc();
}));

// Wrapped objects with a no-op finalizer, immediately unreachable.
for (let i = 0; i < 100; ++i) {
  binding.wrap({});
}

binding.start();
