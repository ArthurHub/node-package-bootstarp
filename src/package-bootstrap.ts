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

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from '@yao-pkg/pkg';
import { logger } from './log.js';
import type { Config } from './config.js';

export async function pkgBootstrapExecutable(config: Config): Promise<void> {
  logger.debug(`Create node executable package...`);

  const bootstrapFileName = 'bootstrap.cjs';
  const bootstrapSrc = path.join(path.dirname(fileURLToPath(import.meta.url)), bootstrapFileName);
  const bootstrap = path.join(config.stagingFolder, bootstrapFileName);
  fs.copyFileSync(bootstrapSrc, bootstrap);

  logger.debug(`exec pkg..`);
  await exec([bootstrap, '--target', config.targetPlatform, '--output', config.outputFilePath]);
}
