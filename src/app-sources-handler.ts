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

import path from 'path';
import fs from 'fs/promises';
import type { Config } from './config.js';

/**
 * Copy all app sources to the staging folder preserving the same folder structure.
 */
export async function stageAppSources(config: Config): Promise<void> {
  for (const srcFile of config.appSources) {
    const stagedFilePath = path.join(config.appSourcesStagingFolder, srcFile);
    await fs.mkdir(path.dirname(stagedFilePath), { recursive: true });
    await fs.copyFile(srcFile, stagedFilePath);
  }

  await fs.copyFile(config.appPackageJsonFile, path.join(config.appSourcesStagingFolder, config.appPackageJsonFile));
}
