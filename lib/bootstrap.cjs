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

'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const child_process = require('child_process');
const decompress = require('decompress');
const metadata = require('./metadata.json');

const BASE_FOLDER = 'node-single-executable-bootstrap-app';

/**
 * TODO: add full documentation on what bootstrap does and how it is executed
 *
 * For pkg to embed the assets we need to use static names for:
 * metadata.json, node.zip, node_modules.zip, and app_sources.zip
 */
async function bootstrap() {
  try {
    console.info(`${green('>>>>')} Node.js Single Executable Bootstrap Application for "${yellow(metadata.name)}"`);

    const sebPathArgvIdx = process.argv.indexOf('--seb-path');
    const baseFolder = sebPathArgvIdx > -1 ? process.argv[sebPathArgvIdx + 1] : path.join(os.tmpdir(), BASE_FOLDER);

    const tmpFolder = path.join(baseFolder, metadata.name);
    const existingMetadataFile = path.join(tmpFolder, 'metadata.json');
    const existingMetadata = fs.existsSync(existingMetadataFile)
      ? JSON.parse(await fs.promises.readFile(existingMetadataFile, 'utf8'))
      : {};

    // setup only if the uuid is different as indication of new build
    if (metadata.uuid !== existingMetadata.uuid) {
      debug(`New build detected ("${metadata.uuid}" !== "${existingMetadata.uuid}")`);
      await setupApp(tmpFolder);
    }

    // run the bundle with the node inside of it in the temp directory
    const node = path.join(tmpFolder, 'node.exe');
    const bundle = path.join(tmpFolder, 'app', metadata.main);
    debug(`Running ${node} ${bundle}`);
    if (!metadata.debug) {
      console.clear();
    }
    child_process.spawnSync(node, [bundle], {
      detached: false,
      stdio: 'inherit',
    });
  } catch (error) {
    console.error(red(`!!!> Fatal error: ${error.message}`));
  }
}

async function setupApp(tmpFolder) {
  debug(`Setting-up app in "${tmpFolder}"`);

  // create temp directory to unzip the assets
  if (!fs.existsSync(tmpFolder)) {
    fs.mkdirSync(tmpFolder, { recursive: true });
  }

  // copy metadata.json
  await fs.promises.copyFile(path.join(__dirname, 'metadata.json'), path.join(tmpFolder, 'metadata.json'));

  // extract node.exe if doesn't exists
  const nodeExec = path.join(tmpFolder, 'node.exe');
  if (!fs.existsSync(nodeExec)) {
    debug(`extracting node executable`);
    await decompress(path.join(__dirname, `node.zip`), tmpFolder);
  } else {
    debug(`using existing node.exe`);
  }

  // extract node_modules if don't exists
  const nodeModules = path.join(tmpFolder, 'node_modules');
  if (!fs.existsSync(nodeModules)) {
    debug(`extracting node_modules`);
    await decompress(path.join(__dirname, 'node_modules.zip'), nodeModules);
  } else {
    debug(`using existing node_modules`);
  }

  // extract app sources
  debug(`Extracting app sources`);
  await decompress(path.join(__dirname, 'app_sources.zip'), path.join(tmpFolder, 'app'));
}

function debug(message) {
  if (metadata.debug) {
    console.debug(`${green('[DEBUG] >')} ${message}`);
  }
}

function red(text) {
  return `\x1b[31m${text}\x1b[39m`;
}

function green(text) {
  return `\x1b[32m${text}\x1b[39m`;
}

function yellow(text) {
  return `\x1b[33m${text}\x1b[39m`;
}

bootstrap();
