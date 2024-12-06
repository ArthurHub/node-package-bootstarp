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
import { getNodeExecutable } from './node-exec-handler.js';
import { getNodeModules } from './node-deps-handler.js';
import { archiveAssets } from './assets-handler.js';
import { logger } from './log.js';
import { pkgBootstrapExecutable } from './package-bootstrap.js';

const PACK_FOLDER = '.seb-cache';

export async function pack(
  name: string,
  appPath: string,
  outputFolder: string,
  target: string,
  dependencies: string[],
): Promise<void> {
  try {
    logger.info(`Package node application "${name}" from "${appPath}"...`);

    const baseFolder = createFolders(outputFolder);

    getNodeExecutable(baseFolder);

    const appNodeModulesFolder = getNodeModules(name, baseFolder);

    await archiveAssets(baseFolder, appNodeModulesFolder, appPath);

    await pkgBootstrapExecutable(baseFolder, name, outputFolder, target);
  } catch (error) {
    logger.error(error, `Failed to create executable package`);
  }
}

function createFolders(outputFolder: string): string {
  if (!fs.existsSync(PACK_FOLDER)) {
    fs.mkdirSync(PACK_FOLDER, { recursive: true });
  }
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }
  return PACK_FOLDER;
}
