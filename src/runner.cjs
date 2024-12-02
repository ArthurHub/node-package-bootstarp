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

async function main() {
  console.info(`node-runner for ???`);

  // create temp directory to unzip the bundle
  const tmpFolder = path.join(os.tmpdir(), 'node-runner');
  if (!fs.existsSync(tmpFolder)) {
    fs.mkdirSync(tmpFolder, { recursive: true });
  }
  console.debug(`using temp folder "${tmpFolder}"`);

  // extract node.exe if doesn't exists
  const nodeExec = path.join(tmpFolder, 'node.exe');
  if (!fs.existsSync(nodeExec)) {
    console.info(`extracting node.exe`);
    await decompress(path.join(__dirname, 'build/assets/node.zip'), tmpFolder);
  } else {
    console.debug(`using existing node.exe`);
  }

  // extract node_modules if don't exists
  const nodeModules = path.join(tmpFolder, 'node_modules');
  if (!fs.existsSync(nodeModules)) {
    console.info(`extracting node_modules`);
    await decompress(path.join(__dirname, 'build/assets/node_modules.zip'), nodeModules);
  } else {
    console.debug(`using existing node_modules`);
  }

  // always copy bundle js file
  console.debug(`Copying bundle.mjs`);
  await fs.promises.copyFile(path.join(__dirname, 'build/assets/bundle.mjs'), path.join(tmpFolder, 'bundle.mjs'));

  // run the bundle with the node inside of it in the temp directory
  const node = path.join(tmpFolder, 'node.exe');
  const bundle = path.join(tmpFolder, 'bundle.mjs');
  console.debug(`Run ${node} ${bundle}`);
  console.clear();
  const child = child_process.spawnSync(node, [bundle], {
    detached: false,
    stdio: 'inherit',
  });
  child.unref();
}

main();
