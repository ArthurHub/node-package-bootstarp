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

import { log, pc } from './log.js';
import type { Config } from './config.js';
import * as fs from 'fs';
import { basename, join } from 'path';
import archiver from 'archiver';
import { exec } from '@yao-pkg/pkg';
import { stageNodeExecutable } from './node-exec-handler.js';
import { stageAppNodeModules } from './node-deps-handler.js';
import { stageAppSources } from './app-sources-handler.js';
import { randomUUID } from 'crypto';
import { stageBootstrapApp } from './bootstrap-app-handler.js';

export async function pack(config: Config): Promise<void> {
  try {
    log.info(`Package node application "${config.appName}" from "${config.appPackagePath}"`);

    log.info('Stage app sources..');
    await stageAppSources(config);

    log.info('Stage node executable..');
    await stageNodeExecutable(config);

    log.info('Stage node_modules..');
    await stageAppNodeModules(config);

    log.info('Archive staged assets..');
    await archiveAppIntoAssets(config);

    log.info('Gen metadata json assets..');
    await genMetadataJsonAsset(config);

    log.info(`Stage bootstrap node app..`);
    await stageBootstrapApp(config);

    log.info(`Create bootstrap node executable..`);
    await pkgBootstrapAndAssetsIntoExecutable(config);

    log.info(`${pc.greenBright(`SUCCESS`)} (${config.outputFilePath})`);
  } catch (error) {
    log.error(error, `Failed to package app into single executable`);
  }
}

/**
 * Create an archive for each of the 3 assets: node executable, app sources, and node_modules.
 */
async function archiveAppIntoAssets(config: Config): Promise<void> {
  log.debug('Archive node executable asset..');
  await archiveFile(join(config.stagingFolder, 'node.exe'), join(config.bootstrapStageFolder, 'node.zip'));

  log.debug('Archive app sources asset..');
  await archiveFolder(config.appSourcesStagingFolder, join(config.bootstrapStageFolder, 'app_sources.zip'));

  log.debug('Archive node modules asset..');
  await archiveFolder(config.appNodeModulesInnerStagingFolder, join(config.bootstrapStageFolder, 'node_modules.zip'));
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
  await fs.promises.writeFile(join(config.bootstrapStageFolder, 'metadata.json'), JSON.stringify(metadata, null, 2));
}

/**
 * Package using "pkg" the node executable and the 3 assets into a single executable.
 */
export async function pkgBootstrapAndAssetsIntoExecutable(config: Config): Promise<void> {
  log.debug(`exec pkg on "${config.bootstrapStageFile}"..`);
  const args = [config.bootstrapStageFile, '--target', config.targetPlatform, '--output', config.outputFilePath];
  if (config.debugPkg) {
    args.push('--debug');
  }
  await exec(args);
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
