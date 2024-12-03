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
import { join } from 'path';

export function getNodeExecutable(baseFolder) {
  const nodeExec = join(baseFolder, 'node.exe');
  if (!fs.existsSync(nodeExec)) {
    const nodeExec = 'C:\\Program Files\\nodejs\\node.exe';
    console.debug(`Get node executable from "${nodeExec}"`);
    fs.copyFileSync(nodeExec, join(baseFolder, 'node.exe'));
  }
}
