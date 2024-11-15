'use strict';

// Therefore those skilled at the unorthodox
// are infinite as heaven and earth,
// inexhaustible as the great rivers.
// When they come to an end,
// they begin again,
// like the days and months;
// they die and are reborn,
// like the four seasons.
//
// - Sun Tsu, The Art of War.
//
// ArthurHub, 2024

import * as path from 'path';
import * as fs from 'fs';
import * as child_process from 'child_process';
import archiver from 'archiver';
import * as pkg from 'pkg';

async function main() {
  try {
    const buildDir = path.join(process.cwd(), 'build');
    if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, true);

    getNodeExecutable(buildDir);

    getNodeModules(buildDir);

    const assetsDir = path.join(buildDir, 'assets');
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);
    await archiveAssets(buildDir, assetsDir);

    await createNodeExecutable(assetsDir);
  } catch (error) {
    console.error(`Failed to create package: ${error.message}`, error);
  }
}

function getNodeExecutable(buildDir) {
  const nodeExec = path.join(buildDir, 'node.exe');
  if (!fs.existsSync(nodeExec)) {
    const nodeExec = 'C:\\Program Files\\nodejs\\node.exe';
    console.debug(`Get node executable from "${nodeExec}"`);
    fs.copyFileSync(nodeExec, path.join(buildDir, 'node.exe'));
  }
}

function getNodeModules(buildDir) {
  const packageJsonPath = path.join(buildDir, 'package.json');
  const nodeModulesPackageJson = {
    name: 'temp',
    dependencies: {
      pino: '^9.5.0',
      trash: '^6.0.0',
      'pino-pretty': '^12.0.0',
      'exiftool-vendored': '^29.0.0',
    },
  };
  console.debug(`Write package.json..`);
  fs.writeFileSync(packageJsonPath, JSON.stringify(nodeModulesPackageJson, null, 2));

  console.debug(`Run npm install..`);
  child_process.execFileSync(
    'npm.cmd',
    ['install', buildDir, '--prefix', buildDir, '--no-bin-links'],
    {
      shell: true,
    },
  );

  console.debug('Clean-lean node_modules..');
  const [rmFoldersCount, rmFilesCount] = deleteNonProdNodeModulesFiles(
    path.join(buildDir, 'node_modules'),
    [
      'tsconfig.json',
      'license',
      'test',
      'tests',
      'benchmark',
      'benchmarks',
      'example',
      'examples',
      'help',
      'man',
      'doc',
      'docs',
      'types',
      'rollup',
      'tsconfig',
      'tsconfigs',
      '.github',
      '.eslintrc',
    ],
    ['.md', '.ts', '.png', '.yaml', '.yml', '.map', '.cmd'],
  );
  console.debug(`Removed ${rmFoldersCount} folders and ${rmFilesCount} files`);
}

function deleteNonProdNodeModulesFiles(folder, namesToDelete, extensionsToDelete) {
  try {
    let rmFoldersCount = 0;
    let rmFilesCount = 0;
    const files = fs.readdirSync(folder, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(folder, file.name);
      const lcName = file.name.toLowerCase();
      if (file.isSymbolicLink()) {
        fs.unlinkSync(fullPath);
        rmFilesCount++;
      } else if (
        namesToDelete.includes(lcName) ||
        extensionsToDelete.includes(path.extname(lcName))
      ) {
        if (file.isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
          rmFoldersCount++;
        } else {
          fs.unlinkSync(fullPath);
          rmFilesCount++;
        }
      } else if (file.isDirectory()) {
        const [recFoldersCount, recFilesCount] = deleteNonProdNodeModulesFiles(
          fullPath,
          namesToDelete,
          extensionsToDelete,
        );
        rmFoldersCount += recFoldersCount;
        rmFilesCount += recFilesCount;
      }
    }
    return [rmFoldersCount, rmFilesCount];
  } catch (err) {
    console.error(`Error processing ${folder}:`, err);
  }
}

async function archiveAssets(buildDir, assetsDir) {
  console.debug('Archive node executable asset..');
  await archiveNodeExecutable(buildDir, assetsDir);

  console.debug('Archive node modules asset..');
  await archiveNodeModules(buildDir, assetsDir);

  console.debug('Copy bundle asset..');
  const bundleName = 'bundle.mjs';
  fs.copyFileSync(path.join(process.cwd(), bundleName), path.join(assetsDir, bundleName));
}

async function archiveNodeExecutable(buildDir, assetsDir) {
  const output = fs.createWriteStream(path.join(assetsDir, 'node.zip'));
  const archive = archiver('zip', {
    zlib: { level: 9 },
  });
  archive.pipe(output);

  archive.file(path.join(buildDir, 'node.exe'), { name: 'node.exe' });
  await archive.finalize();
}

async function archiveNodeModules(buildDir, assetsDir) {
  const output = fs.createWriteStream(path.join(assetsDir, 'node_modules.zip'));
  const archive = archiver('zip', {
    zlib: { level: 9 },
  });
  archive.pipe(output);

  archive.directory(path.join(buildDir, 'node_modules'), false);
  await archive.finalize();
}

async function createNodeExecutable(assetsDir) {
  console.debug('Create node executable pkg..');
  await pkg.exec([
    'runner.cjs',
    '--target',
    'latest-win-x64',
    '--assets',
    `"${assetsDir}/**/*"`,
    '--output',
    'dist/node-runner.exe',
  ]);
}

await main();
