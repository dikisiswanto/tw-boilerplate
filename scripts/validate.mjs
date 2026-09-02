import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = resolve(import.meta.dirname, '..');
const cli = resolve(
  root,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'html-validate.cmd' : 'html-validate',
);

try {
  await execFileAsync(cli, ['build/**/*.html'], {
    cwd: root,
    shell: process.platform === 'win32',
  });
  console.log('HTML validation passed.');
} catch (error) {
  process.stderr.write(error.stdout ?? '');
  process.stderr.write(error.stderr ?? '');
  process.exitCode = error.code || 1;
}
