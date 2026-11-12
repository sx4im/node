'use strict';
// Flags: --expose-gc

const common = require('../../common');
const assert = require('assert');
const binding = require(
  `./build/${common.buildType}/test_gc_in_uncaught_exception_handler`);

// The threadsafe function throws, which is reported through
// `uncaughtException`. Running a GC from the handler collects the wrapped
// objects above, whose finalizers must not re-report the same exception:
// without the fix, the process aborts with
// "FATAL ERROR: Re-entrant uncaught exception detected."
process.on('uncaughtException', common.mustCall((error) => {
  assert.strictEqual(error.message, 'thrown from call_js_cb');
  gc();
}));

// Wrapped objects with a no-op finalizer, immediately unreachable.
for (let i = 0; i < 100; ++i) {
  binding.wrap({});
}

binding.start();
