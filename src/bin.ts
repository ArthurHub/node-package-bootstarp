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
import { logger, pc } from './log.js';
import { pack } from './packager.js';

async function main(): Promise<void> {
  try {
    const packageJson = await fs.promises.readFile('package.json', 'utf-8');
    const { version } = JSON.parse(packageJson) as { version: string };

    const program = new Command();
    program
      .name('bootapp')
      .description(
        'CLI to package a Node.js application into a single executable to run on any ' +
          'device without pre-requisites, dependencies, or environment compatibility issues.',
      )
      .version(version);
    await program
      .arguments('<package-path> <sources-glob>')
      .option('-d, --debug', 'Show debug information')
      .option('-n, --name <name>', 'The name of the executable', './')
      .option('-o, --output <output>', 'Output directory or file name for the single executable', './')
      .option('-t, --target <target>', 'Target platforms for the package (windows/macos/linux)', 'node20-win-x64')
      .option('--dep-add [dependencies...]', 'Dependencies to include in the executable package')
      .option('--dep-remove [dependencies...]', 'Dependencies to exclude in the executable package')
      .option(
        '--dev-override [dependencies...]',
        'Override dependencies to ONLY use those dependencies in the executable package',
      )
      .action(
        async (
          packagePath: string,
          sourcesGlob: string,
          options: {
            output: string;
            target: string;
            add: string[];
            remove: string[];
            override: string[];
            debug: boolean;
          },
        ) => {
          if (options.debug) {
            logger.enableDebug();
            logger.debug(`Config:
              ${pc.yellow('package:')} ${packagePath}
              ${pc.yellow('sources:')} ${sourcesGlob}
              ${pc.yellow('options:')} ${logger.colorizeJson(options)}
              `);
          }
          await pack(packagePath, sourcesGlob, options.output, options.target, []);
        },
      )
      .parseAsync();
  } catch (error) {
    logger.error(error, `Fatal error in main`);
  }
}

await main();
