// Regression test for https://github.com/nodejs/node/issues/67429
// fs.cpSync should not terminate the process when the destination
// already exists directly under a volume root on Windows.
import * as common from '../common/index.mjs';
import tmpdir from '../common/tmpdir.js';
import assert from 'node:assert';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, parse } from 'node:path';

if (process.platform !== 'win32') {
  common.skip('This test is Windows-only');
}

tmpdir.refresh();

const src = join(tmpdir.path, 'src');
mkdirSync(src, { recursive: true });
writeFileSync(join(src, 'file.txt'), 'hello');

// The destination lives directly under the volume root, so its
// namespaced parent path is the volume itself (\\?\C:).
const dest = join(
  parse(tmpdir.path).root,
  `node-test-cp-sync-67429-${process.pid}`,
);
try {
  mkdirSync(dest);
} catch (err) {
  if (err.code === 'EPERM' || err.code === 'EACCES') {
    common.skip('Cannot create a directory at the volume root');
  }
  throw err;
}

try {
  cpSync(src, dest, { recursive: true });
  assert.strictEqual(readFileSync(join(dest, 'file.txt'), 'utf8'), 'hello');
} finally {
  rmSync(dest, { recursive: true, force: true });
}
