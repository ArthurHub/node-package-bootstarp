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
import path from 'path';
import { execFileSync } from 'child_process';
import { logger } from './log.js';
import type { Config } from './config.js';

export function getNodeModules(config: Config): void {
  const workFolder = config.appNodeModulesStagingFolder;
  if (!fs.existsSync(workFolder)) {
    fs.mkdirSync(workFolder, { recursive: true });
  }

  // TODO: use npm to get top-level dependencies: "npm ls --omit=dev --omit=optional --no-peer --depth=0 --json"
  const packageJson = {
    name: `${config.appName}-node-modules`,
    dependencies: {
      pino: '^9.5.0',
      trash: '^6.0.0',
      'pino-pretty': '^12.0.0',
      'exiftool-vendored': '^29.0.0',
    },
  };
  logger.debug(`Write package.json..`);
  fs.writeFileSync(path.join(workFolder, 'package.json'), JSON.stringify(packageJson, null, 2));

  logger.debug(`Run npm install..`);
  execFileSync('npm.cmd', ['install', '.', '--no-bin-links'], {
    cwd: workFolder,
    shell: true,
  });

  logger.debug('Clean-lean node_modules..');
  const [rmFoldersCount, rmFilesCount] = deleteNonProdNodeModulesFiles(
    path.join(workFolder, 'node_modules'),
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
  logger.debug(`Removed ${rmFoldersCount} folders and ${rmFilesCount} files`);
}

function deleteNonProdNodeModulesFiles(
  folder: string,
  namesToDelete: string[],
  extensionsToDelete: string[],
): [number, number] {
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
      } else if (namesToDelete.includes(lcName) || extensionsToDelete.includes(path.extname(lcName))) {
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
    logger.error(err, `Error processing ${folder}:`);
    return [0, 0];
  }
}
