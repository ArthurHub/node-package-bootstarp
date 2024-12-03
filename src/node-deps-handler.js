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

import * as fs from 'fs';
import { join, extname } from 'path';
import { execFileSync } from 'child_process';

export function getNodeModules(baseFolder) {
  const packageJson = {
    name: 'temp',
    dependencies: {
      pino: '^9.5.0',
      trash: '^6.0.0',
      'pino-pretty': '^12.0.0',
      'exiftool-vendored': '^29.0.0',
    },
  };
  console.debug(`Write package.json..`);
  fs.writeFileSync(join(baseFolder, 'package.json'), JSON.stringify(packageJson, null, 2));

  console.debug(`Run npm install..`);
  execFileSync('npm.cmd', ['install', baseFolder, '--prefix', baseFolder, '--no-bin-links'], {
    shell: true,
  });

  console.debug('Clean-lean node_modules..');
  const [rmFoldersCount, rmFilesCount] = deleteNonProdNodeModulesFiles(
    join(baseFolder, 'node_modules'),
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
      const fullPath = join(folder, file.name);
      const lcName = file.name.toLowerCase();
      if (file.isSymbolicLink()) {
        fs.unlinkSync(fullPath);
        rmFilesCount++;
      } else if (namesToDelete.includes(lcName) || extensionsToDelete.includes(extname(lcName))) {
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
