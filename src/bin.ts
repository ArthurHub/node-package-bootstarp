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
import { Command } from 'commander';
import { logger } from './log.js';
import { pack } from './packager.js';
import { configure, type CLIOptions } from './config.js';

async function main(): Promise<void> {
  try {
    const packageJson = await fs.promises.readFile('package.json', 'utf-8');
    const { version } = JSON.parse(packageJson) as { version: string };

    const program = new Command();
    program
      .name('packseb')
      .description(
        'CLI to package a Node.js application into a single executable bootstrapped app to run on any ' +
          'device without pre-requisites, dependencies, or environment compatibility issues.',
      )
      .version(version);

    await program
      .argument('[app-package]', 'The path to the app package.json', '.')
      .option('-s, --sources <sources...>', 'glob patterns to include as app sources (default: **/*.{js,cjs,mjs,json})')
      .option('-m, --main <main>', 'The main entrypoint of the app (default: main in app package.json)')
      .option('-n, --name <name>', 'The name of the bootstrapped executable app (default: name in app package.json)')
      .option('-o, --output <output>', 'Output directory or file name for the single executable', './out')
      .option('-t, --target <target>', 'Target platforms for the package (windows/macos/linux)', 'node20-win-x64')
      .option('--dep-amend [dependencies...]', 'Dependencies to include in addition to detected in app package.json')
      .option('--dep-exclude [dependencies...]', 'Dependencies to exclude from detected in app package.json')
      .option(
        '--dep-override [dependencies...]',
        'Override dependencies to ONLY use specified dependencies instead of detected in app package.json',
      )
      .option('-d, --debug', 'Show debug information', false)
      .option('--debug-pkg', 'Show debug information from pkg execution', false)
      .option('-c, --clean', 'Clean staging/cache folder before and after packaging', false)
      .action(async (appPackage: string, options: CLIOptions) => {
        const config = await configure(appPackage, options);
        await pack(config);
      })
      .parseAsync();
  } catch (error) {
    logger.error(error, `Fatal error in main`);
  }
}

await main();
