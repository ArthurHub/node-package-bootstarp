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
import { log } from './log.js';
import type { Config } from './config.js';
import { execa } from 'execa';

export async function stageNodeExecutable(config: Config): Promise<void> {
  const nodeExec = path.join(config.stagingFolder, 'node.exe');
  if (!fs.existsSync(nodeExec)) {
    const machineNodeExec = await findNodeExecutable();
    log.debug(`Get node executable from "${machineNodeExec}"`);
    await fs.promises.copyFile(machineNodeExec, nodeExec);
  }
}

/**
 * Finds the Node.js executable path on the current machine.
 * @returns {Promise<string>} The full path to the Node.js executable.
 */
async function findNodeExecutable(): Promise<string> {
  try {
    const command = process.platform === 'win32' ? 'where node' : 'which node';
    const { stdout } = await execa(command);
    const nodePath = stdout.split('\n')[0]?.trim();
    if (nodePath && (await isFileExecutable(nodePath))) {
      return nodePath;
    }
  } catch (error) {
    throw new Error('Unable to locate Node.js executable', { cause: error });
  }
  throw new Error('Unable to locate Node.js executable on this machine.');
}

/**
 * Checks if a file path points to an executable file.
 * @param filePath - The full path to the file.
 * @returns {Promise<boolean>} True if the file exists and is executable, otherwise false.
 */
async function isFileExecutable(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.promises.stat(filePath);
    if (!stats.isFile()) {
      return false;
    }

    // On Windows, we consider the file executable if it exists
    if (process.platform === 'win32') {
      return true;
    }

    // On Unix-like systems, we check for execute permission
    const mode = stats.mode;
    const isExecutable = (mode & 0o111) !== 0; // Check if any execute bit is set
    return isExecutable;
  } catch {
    return false;
  }
}
