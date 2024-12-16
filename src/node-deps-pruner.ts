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

import * as fs from 'fs/promises';
import path from 'path';
import { log } from './log.js';
import type { Config } from './config.js';

const NAMES_TO_DELETE = [
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
  'makefile',
  'tsconfig',
  'tsconfigs',
  '.github',
  '.eslintrc',
];

const EXTENSIONS_TO_DELETE = ['.md', '.ts', '.png', '.yaml', '.yml', '.map', '.cmd'];

/**
 * Delete all "non-prod" files from the node_modules folder.
 */
export async function pruneNodeModules(config: Config): Promise<void> {
  const { fileCount: beforeFileCount, totalSize: beforeTotalSize } = await getFilesCountAndTotalSize(
    config.appNodeModulesInnerStagingFolder,
  );

  await deleteNonProdNodeModulesFiles(config.appNodeModulesInnerStagingFolder);

  const { fileCount: afterFileCount, totalSize: afterTotalSize } = await getFilesCountAndTotalSize(
    config.appNodeModulesInnerStagingFolder,
  );

  log.debug(
    `Removed ${beforeFileCount - afterFileCount} files in total of ${Math.round(
      (beforeTotalSize - afterTotalSize) / 1024,
    )} KB`,
  );
}

async function getFilesCountAndTotalSize(folderPath: string): Promise<{ fileCount: number; totalSize: number }> {
  let fileCount = 0;
  let totalSize = 0;

  async function walk(dir: string): Promise<void> {
    const files = await fs.readdir(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        await walk(fullPath);
      } else {
        fileCount++;
        totalSize += (await fs.stat(fullPath)).size;
      }
    }
  }

  await walk(folderPath);
  return { fileCount, totalSize };
}

async function deleteNonProdNodeModulesFiles(folder: string): Promise<void> {
  try {
    const files = await fs.readdir(folder, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(folder, file.name);
      const lcName = file.name.toLowerCase();
      if (file.isSymbolicLink()) {
        await fs.unlink(fullPath);
      } else if (NAMES_TO_DELETE.includes(lcName) || EXTENSIONS_TO_DELETE.includes(path.extname(lcName))) {
        if (file.isDirectory()) {
          await fs.rm(fullPath, { recursive: true, force: true });
        } else {
          await fs.unlink(fullPath);
        }
      } else if (file.isDirectory()) {
        await deleteNonProdNodeModulesFiles(fullPath);
      }
    }
  } catch (err) {
    log.warn(`Error deleting non-prod node_modules in "${folder}": ${err}`);
  }
}
