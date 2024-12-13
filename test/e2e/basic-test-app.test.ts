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
import { execa } from 'execa';
import { fileURLToPath } from 'url';
import { pc } from '../../src/log.js';

describe('E2E Test for basic-test-app', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  afterAll(async () => {
    await fs.promises.rm('test-output', { recursive: true, force: true });
  });

  it('should create the executable file', async () => {
    const { stdout } = await execa('node', [
      path.join(__dirname, '../../dist/bin.js'),
      'test/basic-test-app',
      '--output',
      'test-output',
    ]);

    const outputFilePath = path.join('test-output', `basic-test-app.exe`);
    expect(fs.existsSync(outputFilePath)).toBe(true);
    expect(stdout).toContain(pc.greenBright('SUCCESS'));
  }, 30_000); // 30 seconds timeout
});
