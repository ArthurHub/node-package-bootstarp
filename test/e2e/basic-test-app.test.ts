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

import { describe, it, expect, afterAll } from 'vitest';
import * as fs from 'fs';
import path from 'path';
import os from 'os';
import { execa } from 'execa';
import { fileURLToPath } from 'url';
import { pc } from '../../src/log.js';
import { randomBytes } from 'crypto';

describe('E2E Test for basic-test-app', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const outputTempFolder = path.join(os.tmpdir(), randomBytes(16).toString('hex'));

  afterAll(async () => {
    await fs.promises.rm(outputTempFolder, { recursive: true, force: true });
  });

  it('should create the executable file', async () => {
    const { stdout: pack_stdout } = await execa('node', [
      path.join(__dirname, '../../dist/bin.js'),
      'test/basic-test-app',
      '--output',
      outputTempFolder,
    ]);

    const outputFilePath = path.join(outputTempFolder, `basic-test-app.exe`);
    expect(fs.existsSync(outputFilePath)).toBe(true);
    expect(pack_stdout).toContain(pc.greenBright('SUCCESS'));

    const { stdout: run_stdout } = await execa(outputFilePath, ['--seb-path', path.join(outputTempFolder, 'seb-out')]);
    expect(run_stdout).toContain(pc.red('Hello'));
    expect(run_stdout).toContain('world!');
  }, 30_000); // 30 seconds timeout
});
