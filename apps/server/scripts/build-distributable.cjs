const { spawnSync } = require('node:child_process');
const path = require('node:path');

const serverDir = path.resolve(__dirname, '..');
const webDir = path.resolve(__dirname, '../../web');

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('pnpm', ['run', 'build'], webDir);
run('pnpm', ['run', 'build'], serverDir);
