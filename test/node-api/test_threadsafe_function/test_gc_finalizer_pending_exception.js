// Flags: --expose-gc
'use strict';

const common = require('../../common');
const assert = require('assert');
const binding = require(
  `./build/${common.buildType}/test_gc_finalizer_pending_exception`);

// Regression test for https://github.com/nodejs/node/issues/67421:
// calling gc() from an `uncaughtException` handler must not abort the
// process while finalizers are pending. Before the fix, the stale pending
// exception from the threadsafe function callback was reported a second
// time by a finalizer invoked from the GC, tripping the re-entrancy guard
// in TriggerUncaughtException.
process.on('uncaughtException', common.mustCall((err) => {
  assert.strictEqual(err.message, 'thrown from call_js_cb');
  gc();
}));

// Wrapped objects with a no-op finalizer, immediately unreachable.
for (let i = 0; i < 100; i++) {
  binding.wrap({});
}

binding.start();
