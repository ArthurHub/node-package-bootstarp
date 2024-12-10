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

import { getNodeExecutable } from './node-exec-handler.js';
import { stageAppNodeModules } from './node-deps-handler.js';
import { archiveAssets as archiveAppIntoAssets } from './assets-handler.js';
import { logger } from './log.js';
import { pkgBootstrapExecutable } from './package-bootstrap.js';
import type { Config } from './config.js';

export async function pack(config: Config): Promise<void> {
  try {
    logger.info(`Package node application "${config.appName}" from "${config.appPackagePath}"...`);

    getNodeExecutable(config);

    await stageAppNodeModules(config);

    await archiveAppIntoAssets(config);

    await pkgBootstrapExecutable(config);
  } catch (error) {
    logger.error(error, `Failed to create executable package`);
  }
}
