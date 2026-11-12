// This tests that cpSync() does not terminate the process when the
// destination already exists directly under a volume root on Windows.
// See https://github.com/nodejs/node/issues/67429
import { mustNotMutateObjectDeep, isWindows, skip } from '../common/index.mjs';
import { nextdir, assertDirEquivalent } from '../common/fs.js';
import assert from 'node:assert';
import {
  cpSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, parse } from 'node:path';
import tmpdir from '../common/tmpdir.js';

if (!isWindows)
  skip('This test is Windows-specific');

tmpdir.refresh();

const src = nextdir();
mkdirSync(join(src, 'sub'), { recursive: true });
writeFileSync(join(src, 'sub', 'file.txt'), 'x');

// Destination directly under the volume root, e.g. C:\test-... .
const root = parse(tmpdir.path).root;
const dest = join(root, `test-fs-cp-sync-volume-root-${process.pid}`);
mkdirSync(dest);

try {
  cpSync(src, dest, mustNotMutateObjectDeep({ recursive: true }));
  assertDirEquivalent(src, dest);
  assert.strictEqual(readFileSync(join(dest, 'sub', 'file.txt'), 'utf8'), 'x');
} finally {
  rmSync(dest, { recursive: true, force: true });
}
