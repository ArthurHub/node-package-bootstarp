#!/usr/bin/env node

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
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import { exec } from 'pkg';
import { getNodeExecutable } from './node-exec-handler.js';
import { getNodeModules } from './node-deps-handler.js';
import { archiveAssets } from './assets-handler.js';

export const BASE_FOLDER = '.node-pkg-boot-cache';

async function main() {
  const program = new Command();
  program
    .name('pkg-bootstrap')
    .description('CLI to package a node application into a single executable')
    .version('0.1.0');
  program
    .arguments('<name>', 'Name of the package')
    .arguments('<app-path>', 'Path to the node application to package')
    .option('-o, --output <output>', 'Output directory for the package', './')
    .option('-t, --target <target>', 'Target platform for the package', 'latest-win-x64')
    .option('-d, --dependencies [dependencies...]', 'Dependencies to include in the package')
    .action((name, appPath, options) => {
      run(name, appPath, options.output, options.target, options.dependencies);
    })
    .parse();
}

async function run(name, appPath, outputFolder, target, dependencies) {
  try {
    console.debug(`Package node application "${name}" from "${appPath}"...`);

    const baseFolder = createFolders(outputFolder);

    getNodeExecutable(baseFolder);

    getNodeModules(baseFolder);

    await archiveAssets(baseFolder, appPath);

    await createNodeExecutable(baseFolder, name, outputFolder, target);
  } catch (error) {
    console.error(`Failed to create executable package: ${error.message}`, error);
  }
}

function createFolders(outputFolder) {
  const baseFolder = BASE_FOLDER;
  if (!fs.existsSync(baseFolder)) {
    fs.mkdirSync(baseFolder, true);
  }
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, true);
  }
  return baseFolder;
}

async function createNodeExecutable(baseFolder, name, outputFolder, target) {
  console.debug(`Create node executable package...`);

  const bootstrapFileName = 'bootstrap.cjs';
  const bootstrapSrc = join(dirname(fileURLToPath(import.meta.url)), bootstrapFileName);
  const bootstrap = join(baseFolder, bootstrapFileName);
  fs.copyFileSync(bootstrapSrc, bootstrap);

  console.debug(`exec pkg..`);
  const outputFile = join(outputFolder, name);
  await exec([bootstrap, '--target', target, '--output', outputFile]);
}

await main();
