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
import path from 'path';
import { logger, pc } from './log.js';
import { glob } from 'glob';

export interface CLIOptions {
  debug: boolean;
  clean: boolean;
  output: string;
  target: string;
  'dep-add': string[];
  'dep-remove': string[];
  'dep-override': string[];
}

export class Config {
  readonly appName: string;
  readonly appPackageJsonPath: string;
  readonly appSources: string[];
  readonly appMain: string;
  readonly stagingFolder: string;
  readonly outputFilePath: string;
  readonly targetPlatform: string;

  constructor(
    appName: string,
    appPackageJsonPath: string,
    appSources: string[],
    appMain: string,
    stagingFolder: string,
    outputFilePath: string,
    targetPlatform: string,
  ) {
    this.appName = appName;
    this.appPackageJsonPath = appPackageJsonPath;
    this.appSources = appSources;
    this.appMain = appMain;
    this.stagingFolder = stagingFolder;
    this.outputFilePath = outputFilePath;
    this.targetPlatform = targetPlatform;
  }

  get appSourcesStagingFolder(): string {
    return path.join(this.stagingFolder, 'app_sources');
  }

  get appNodeModulesStagingFolder(): string {
    return path.join(this.stagingFolder, 'app_node_modules');
  }

  get appNodeModulesInnerStagingFolder(): string {
    return path.join(this.stagingFolder, 'app_node_modules', 'node_modules');
  }
}

export async function configure(packagePath: string, sourcesGlob: string, options: CLIOptions): Promise<Config> {
  if (options.debug) {
    logger.enableDebug();
    logger.debug(`CLI:
        ${pc.yellow('package:')} ${packagePath}
        ${pc.yellow('sources:')} ${sourcesGlob}
        ${pc.yellow('options:')} ${logger.colorizeJson(options)}
        `);
  }

  // read the app package.json to parse some configuration info
  const packageJsonPath = packagePath.endsWith('.json') ? packagePath : path.join(packagePath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found. Looking for: "${packageJsonPath}"`);
  }
  const packageJson = await fs.promises.readFile(packageJsonPath, 'utf-8');
  const { name, main } = JSON.parse(packageJson) as { name: string; main: string };

  // collect the app source files from glob
  const sources = await glob(sourcesGlob);
  if (sources.length === 0) {
    throw new Error(`No source files found matching the glob pattern: "${sourcesGlob}"`);
  }

  // identify the app main file to run
  const appMain = main ? path.join(packagePath, main) : sources.length === 1 ? sources[0] : undefined;
  if (!appMain) {
    throw new Error(
      `No main file found in package.json and multiple source files found. Please specify the main file.`,
    );
  }

  // configure the staging and output folders
  const stagingFolder = '.seb-cache';
  await createFolders(stagingFolder, options.output, options.clean);

  // configure the name of the executable output file
  const outputFilePath = path.join(options.output, `${name}.exe`);

  return new Config(name, packageJsonPath, sources, appMain, stagingFolder, outputFilePath, options.target);
}

async function createFolders(stagingFolder: string, outputFolder: string, clean: boolean): Promise<void> {
  if (clean && fs.existsSync(stagingFolder)) {
    await fs.promises.rm(stagingFolder, { recursive: true, force: true });
  }
  if (!fs.existsSync(stagingFolder)) {
    await fs.promises.mkdir(stagingFolder, { recursive: true });
  }
  if (!fs.existsSync(outputFolder)) {
    await fs.promises.mkdir(outputFolder, { recursive: true });
  }
}
