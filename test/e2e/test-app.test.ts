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

describe('E2E Test', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const tempFolder = path.join(os.tmpdir(), 'seb-test', randomBytes(16).toString('hex'));

  afterAll(async () => {
    // await fs.promises.rm(tempFolder, { recursive: true, force: true });
  });

  it('succeed for basic test app', async () => {
    const stageTempFolder = path.join(tempFolder, 'basic');
    const outputTempFolder = path.join(stageTempFolder, 'out');

    const pack_stdout = await runPackageBin('test/basic-test-app', stageTempFolder, outputTempFolder);

    const outputFilePath = path.join(outputTempFolder, `basic-test-app.exe`);
    expect(fs.existsSync(outputFilePath)).toBe(true);
    expect(pack_stdout).toContain(pc.greenBright('SUCCESS'));

    const run_stdout = await runBootrapApp(stageTempFolder, outputFilePath);
    expect(run_stdout).toContain('Basic:');
    expect(run_stdout).toContain(pc.red('Hello'));
  }, 50_000);

  it('succeed for complex test app', async () => {
    const stageTempFolder = path.join(tempFolder, 'complex');
    const outputTempFolder = path.join(stageTempFolder, 'out');

    const pack_stdout = await runPackageBin(
      'test/complex-test-app',
      stageTempFolder,
      outputTempFolder,
      '--sources',
      'test/complex-test-app/**/*.{js,cjs,mjs,json}',
      'test/other-package/**/*.{js,cjs,mjs,json}',
    );

    const outputFilePath = path.join(outputTempFolder, `complex-test-app.exe`);
    expect(fs.existsSync(outputFilePath)).toBe(true);
    expect(pack_stdout).toContain(pc.greenBright('SUCCESS'));

    const run_stdout = await runBootrapApp(stageTempFolder, outputFilePath);
    expect(run_stdout).toContain('Complex:');
    expect(run_stdout).toContain(pc.red('Hello'));
  }, 50_000);

  async function runPackageBin(
    appFolder: string,
    stageTempFolder: string,
    outputTempFolder: string,
    ...moreArgs: string[]
  ): Promise<string> {
    const { stdout, stderr } = await execa('node', [
      path.join(__dirname, '../../dist/bin.js'),
      appFolder,
      '--stage-folder',
      stageTempFolder,
      '--output',
      outputTempFolder,
      '--debug',
      ...moreArgs,
    ]);
    console.log('--stdout--');
    console.log(stdout);
    console.log('--stderr--');
    console.log(stderr);
    return stdout;
  }

  async function runBootrapApp(stageTempFolder: string, outputFilePath: string): Promise<string> {
    const { stdout, stderr } = await execa(outputFilePath, ['--seb-path', path.join(stageTempFolder, 'seb-app')]);
    console.log('--stdout--');
    console.log(stdout);
    console.log('--stderr--');
    console.log(stderr);
    return stdout;
  }
});
