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
import { dirname, join } from 'path';
import type { Config } from './config.js';
import { logger } from './log.js';
import { execa } from 'execa';
import { fileURLToPath } from 'url';

/**
 * Stage the bootstrap js file and install it's node dependencies.
 */
export async function stageBootstrapApp(config: Config): Promise<void> {
  logger.debug(`Stage bootstrap js file "${config.bootstrapStageFile}"..`);
  await fs.promises.copyFile(config.bootstrapLibFile, config.bootstrapStageFile);

  // get bootstrap dependencies versions
  const bootstrapLibPackgeJson = JSON.parse(
    await fs.promises.readFile(join(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf8'),
  ) as {
    dependencies: Record<string, string>;
  };
  const packageJson = {
    name: `${config.appName}-seb`,
    dependencies: {
      commander: bootstrapLibPackgeJson.dependencies['commander'],
      decompress: bootstrapLibPackgeJson.dependencies['decompress'],
    },
  };
  logger.debug(`Write "package.json": ${logger.colorizeJson(packageJson)}`);
  await fs.promises.writeFile(join(config.bootstrapStageFolder, 'package.json'), JSON.stringify(packageJson, null, 2));

  logger.debug(`Run npm install for bootstrap app..`);
  const { stdout } = await execa('npm.cmd', ['install', '.', '--no-bin-links'], { cwd: config.bootstrapStageFolder });
  logger.debug(stdout);
}
