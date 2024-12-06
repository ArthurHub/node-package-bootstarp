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

export async function pkgBootstrapExecutable(
  baseFolder: string,
  name: string,
  outputFolder: string,
  target: string,
): Promise<void> {
  logger.debug(`Create node executable package...`);

  const bootstrapFileName = 'bootstrap.cjs';
  const bootstrapSrc = path.join(path.dirname(fileURLToPath(import.meta.url)), bootstrapFileName);
  const bootstrap = path.join(baseFolder, bootstrapFileName);
  fs.copyFileSync(bootstrapSrc, bootstrap);

  logger.debug(`exec pkg..`);
  const outputFile = path.join(outputFolder, name);
  await exec([bootstrap, '--target', target, '--output', outputFile]);
}
