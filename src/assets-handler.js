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
import { basename, join } from 'path';
import archiver from 'archiver';

export async function archiveAssets(baseFolder, appPath) {
  console.debug('Archive node executable asset..');
  await archiveNodeExecutable(baseFolder);

  console.debug('Archive node modules asset..');
  await archiveNodeModules(baseFolder);

  console.debug('Copy bundle asset..');
  const appName = basename(appPath);
  fs.copyFileSync(appPath, join(baseFolder, appName));
}

async function archiveNodeExecutable(baseFolder) {
  const output = fs.createWriteStream(join(baseFolder, 'node.zip'));
  const archive = archiver('zip', {
    zlib: { level: 9 },
  });
  archive.pipe(output);

  archive.file(join(baseFolder, 'node.exe'), { name: 'node.exe' });
  await archive.finalize();
}

async function archiveNodeModules(baseFolder) {
  const output = fs.createWriteStream(join(baseFolder, 'node_modules.zip'));
  const archive = archiver('zip', {
    zlib: { level: 9 },
  });
  archive.pipe(output);

  archive.directory(join(baseFolder, 'node_modules'), false);
  await archive.finalize();
}
