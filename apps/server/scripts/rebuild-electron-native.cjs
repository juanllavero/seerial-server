const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const nativeModules = ['better-sqlite3', 'bcrypt'];

function getElectronVersion() {
  try {
    const electronEntry = require.resolve('electron');
    const electronPkgPath = path.join(path.dirname(electronEntry), 'package.json');
    const electronPkg = JSON.parse(fs.readFileSync(electronPkgPath, 'utf8'));

    if (!electronPkg.version) {
      throw new Error('Electron package version is missing.');
    }

    return electronPkg.version;
  } catch {
    process.stderr.write('Unable to resolve installed Electron version.\n');
    process.exit(1);
  }
}

function findElectronRebuildCli() {
  try {
    const cliPath = require.resolve('@electron/rebuild/lib/cli');
    return cliPath;
  } catch {
    // fallback: search in .pnpm store relative to project root
    const projectRoot = path.resolve(__dirname, '..', '..', '..');
    const storeGlob = path.join(
      projectRoot,
      'node_modules',
      '.pnpm',
      '@electron+rebuild@*',
      'node_modules',
      '@electron',
      'rebuild',
      'lib',
      'cli.js',
    );
    const { globSync } = require('node:fs');
    if (globSync) {
      const matches = globSync(storeGlob);
      if (matches.length > 0) return matches[0];
    }
    process.stderr.write('Unable to resolve @electron/rebuild CLI.\n');
    process.exit(1);
  }
}

function runRebuild(electronVersion) {
  // apps/server is where pnpm exposes the native modules for this package.
  // The actual binaries live in the root .pnpm virtual store which pnpm
  // symlinks into apps/server/node_modules.
  const moduleDir = path.resolve(__dirname, '..');
  let cliPath;
  try {
    cliPath = require.resolve('@electron/rebuild/lib/cli');
  } catch {
    const projectRoot = path.resolve(moduleDir, '..', '..');
    const pattern = path.join(projectRoot, 'node_modules', '.pnpm', '@electron+rebuild@*');
    const dirs = fs
      .readdirSync(path.join(projectRoot, 'node_modules', '.pnpm'))
      .filter((d) => d.startsWith('@electron+rebuild@'));
    if (dirs.length === 0) {
      process.stderr.write('@electron/rebuild not found in pnpm store.\n');
      process.exit(1);
    }
    cliPath = path.join(
      projectRoot,
      'node_modules',
      '.pnpm',
      dirs[0],
      'node_modules',
      '@electron',
      'rebuild',
      'lib',
      'cli.js',
    );
  }

  const result = spawnSync(
    process.execPath,
    [
      cliPath,
      '--version',
      electronVersion,
      '--module-dir',
      moduleDir,
      '--dist-url',
      'https://artifacts.electronjs.org/headers/dist',
      '--force',
      '-w',
      nativeModules.join(','),
    ],
    { stdio: 'inherit', shell: false },
  );

  if (result.error) {
    process.stderr.write(`${result.error.message}\n`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const electronVersion = getElectronVersion();
runRebuild(electronVersion);
