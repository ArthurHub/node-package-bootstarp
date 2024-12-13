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

import { logger, pc } from './log.js';
import type { Config } from './config.js';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { basename, dirname, join } from 'path';
import archiver from 'archiver';
import { exec } from '@yao-pkg/pkg';
import { stageNodeExecutable } from './node-exec-handler.js';
import { stageAppNodeModules } from './node-deps-handler.js';
import { stageAppSources } from './app-sources-handler.js';
import { randomUUID } from 'crypto';

export async function pack(config: Config): Promise<void> {
  try {
    logger.info(`Package node application "${config.appName}" from "${config.appPackagePath}"`);

    logger.info('Stage app sources..');
    await stageAppSources(config);

    logger.info('Stage node executable..');
    await stageNodeExecutable(config);

    logger.info('Stage node_modules..');
    await stageAppNodeModules(config);

    logger.info('Archive staged assets..');
    await archiveAppIntoAssets(config);

    logger.info('Gen metadata json assets..');
    await genMetadataJsonAsset(config);

    logger.info(`Create bootstrap node executable..`);
    await pkgBootstrapAndAssetsIntoExecutable(config);

    logger.info(`${pc.greenBright(`SUCCESS`)} (${config.outputFilePath})`);
    await cleanStagingSafe(config);
  } catch (error) {
    logger.error(error, `Failed to package app into single executable`);
  }
}

/**
 * Create an archive for each of the 3 assets: node executable, app sources, and node_modules.
 */
async function archiveAppIntoAssets(config: Config): Promise<void> {
  logger.debug('Archive node executable asset..');
  await archiveFile(join(config.stagingFolder, 'node.exe'), join(config.stagingFolder, 'node.zip'));

  logger.debug('Archive app sources asset..');
  await archiveFolder(config.appSourcesStagingFolder, join(config.stagingFolder, 'app_sources.zip'));

  logger.debug('Archive node modules asset..');
  await archiveFolder(config.appNodeModulesInnerStagingFolder, join(config.stagingFolder, 'node_modules.zip'));
}

/**
 * Write metadata of the app for the bootstrap to read.
 */
async function genMetadataJsonAsset(config: Config): Promise<void> {
  const metadata = {
    name: config.appName,
    debug: config.debug,
    uuid: randomUUID(),
    main: config.appMain,
    target: config.targetPlatform,
  };
  await fs.promises.writeFile(join(config.stagingFolder, 'metadata.json'), JSON.stringify(metadata, null, 2));
}

/**
 * Package using "pkg" the node executable and the 3 assets into a single executable.
 */
export async function pkgBootstrapAndAssetsIntoExecutable(config: Config): Promise<void> {
  const bootstrapFileName = 'bootstrap.cjs';
  const bootstrapSrc = join(dirname(fileURLToPath(import.meta.url)), '../lib/', bootstrapFileName);
  const bootstrapStage = join(config.stagingFolder, bootstrapFileName);
  fs.copyFileSync(bootstrapSrc, bootstrapStage);

  logger.debug(`exec pkg on "${bootstrapStage}"..`);
  const args = [bootstrapStage, '--target', config.targetPlatform, '--output', config.outputFilePath];
  if (config.debugPkg) {
    args.push('--debug');
  }
  await exec(args);
}

async function cleanStagingSafe(config: Config): Promise<void> {
  try {
    if (config.clean) {
      await fs.promises.rmdir(config.stagingFolder, { recursive: true });
    }
  } catch (err) {
    logger.warn(`Failed to clean staging folder "${config.stagingFolder}: ${err}`);
  }
}

async function archiveFile(file: string, zipFile: string): Promise<void> {
  const output = fs.createWriteStream(zipFile);
  const archive = archiver('zip', {
    zlib: { level: 9 },
  });
  archive.pipe(output);

  archive.file(file, { name: basename(file) });
  await archive.finalize();
}

async function archiveFolder(folder: string, zipFile: string): Promise<void> {
  const output = fs.createWriteStream(zipFile);
  const archive = archiver('zip', {
    zlib: { level: 9 },
  });
  archive.pipe(output);

  archive.directory(folder, false);
  await archive.finalize();
}
