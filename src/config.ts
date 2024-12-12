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
  sources?: string[];
  main?: string;
  name?: string;
  output: string;
  target: string;
  depAdd?: string[];
  depExclude?: string[];
  depOverride?: string[];
  debug: boolean;
  debugPkg: boolean;
  clean: boolean;
}

export class Config {
  constructor(
    readonly appName: string,
    readonly appPackagePath: string,
    readonly appSources: string[],
    readonly appMain: string,
    readonly stagingFolder: string,
    readonly outputFilePath: string,
    readonly targetPlatform: string,
    readonly debug: boolean,
    readonly debugPkg: boolean,
    readonly clean: boolean,
  ) {}

  get appPackageJsonFile(): string {
    return path.join(this.appPackagePath, 'package.json');
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

export async function configure(appPackage: string, options: CLIOptions): Promise<Config> {
  if (options.debug) {
    logger.enableDebug();
    logger.debug(`CLI arguments:
${pc.cyan('app-package:')} ${pc.green(appPackage)},
${pc.cyan('options:')} ${logger.colorizeJson(options)}`);
  }

  // read the app package.json to parse some configuration info
  const containJsonInAppPackage = appPackage.toLowerCase().endsWith('.json');
  const appPackageDir = containJsonInAppPackage ? path.dirname(appPackage) : appPackage;
  const appPackageJsonFile = containJsonInAppPackage ? appPackage : path.join(appPackageDir, 'package.json');
  if (!fs.existsSync(appPackageJsonFile)) {
    throw new Error(`package.json not found. Looking for: "${appPackageJsonFile}"`);
  }

  const packageJson = await fs.promises.readFile(appPackageJsonFile, 'utf-8');
  const { name, main } = JSON.parse(packageJson) as { name: string; main?: string };
  const appName = options.name ?? name;
  const appMain = options.main ?? main;

  // collect the app source files from glob
  // if no glob was provided, use the main folder as root for all js files inside
  let sourcesGlobs = options.sources;
  if (!sourcesGlobs) {
    const mainParentFolder = appMain ? path.dirname(appMain) : '';
    sourcesGlobs = [`${appPackageDir}/${mainParentFolder}/**/*.{js,cjs,mjs,json}`];
  }
  logger.debug(`Sources globs: ["${sourcesGlobs.join('", "')}"]`);
  const appSources = await glob(sourcesGlobs, { ignore: ['**/node_modules/**'] });
  for (const source of appSources) {
    logger.debug(`Including source file: "${source}"`);
  }
  if (appSources.length === 0) {
    throw new Error(`No source files found matching the glob pattern: ["${sourcesGlobs.join('", "')}"]`);
  }

  // identify the app main file to run
  const fullAppMain = appMain ? path.join(appPackageDir, appMain) : appSources.length === 1 ? appSources[0] : undefined;
  if (!fullAppMain) {
    throw new Error(`Unable to identify main entrypoint file, please specify the main`);
  }
  if (!appSources.includes(fullAppMain)) {
    throw new Error(`Main entry point "${fullAppMain}" was not found in sources, misconfigured main or sources glob?`);
  }

  // configure the name of the executable output file
  const outputFilePath = path.join(options.output, `${appName}.exe`);

  const config = new Config(
    appName,
    appPackageDir,
    appSources,
    fullAppMain,
    '.packseb-cache',
    outputFilePath,
    options.target,
    options.debug,
    options.debugPkg,
    options.clean,
  );

  if (options.debug) {
    logger.debug(`Config: ${logger.colorizeJson(config)}`);
  }

  await createFolders(config, options.output, options.clean);
  return config;
}

async function createFolders(config: Config, outputFolder: string, clean: boolean): Promise<void> {
  if (clean && fs.existsSync(config.stagingFolder)) {
    await fs.promises.rm(config.stagingFolder, { recursive: true, force: true });
  }
  if (!fs.existsSync(config.stagingFolder)) {
    await fs.promises.mkdir(config.stagingFolder, { recursive: true });
  }
  if (!fs.existsSync(outputFolder)) {
    await fs.promises.mkdir(outputFolder, { recursive: true });
  }
  if (!fs.existsSync(config.appSourcesStagingFolder)) {
    await fs.promises.mkdir(config.appSourcesStagingFolder, { recursive: true });
  }
  if (!fs.existsSync(config.appNodeModulesStagingFolder)) {
    await fs.promises.mkdir(config.appNodeModulesStagingFolder, { recursive: true });
  }
}
