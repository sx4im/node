// This tests that cpSync does not terminate the process on Windows when the
// destination already exists directly under a volume root.
// See https://github.com/nodejs/node/issues/67429
import * as common from '../common/index.mjs';
import { mustNotMutateObjectDeep } from '../common/index.mjs';
import { assertDirEquivalent } from '../common/fs.js';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import tmpdir from '../common/tmpdir.js';
import fixtures from '../common/fixtures.js';

if (process.platform !== 'win32') {
  common.skip('this test is Windows-specific.');
}

tmpdir.refresh();

const src = fixtures.path('copy/kitchen-sink');
// Destination directly under the volume root, e.g. C:\test-cp-sync-<pid>.
const dest = path.join(path.parse(tmpdir.path).root,
                       `test-cp-sync-${process.pid}`);
mkdirSync(dest);
try {
  cpSync(src, dest, mustNotMutateObjectDeep({ recursive: true }));
  assertDirEquivalent(src, dest);
} finally {
  rmSync(dest, { recursive: true, force: true });
}
