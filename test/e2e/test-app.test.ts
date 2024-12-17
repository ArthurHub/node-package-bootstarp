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
import { execa, ExecaError } from 'execa';
import { fileURLToPath } from 'url';
import { pc } from '../../src/log.js';
import { randomBytes } from 'crypto';

describe('E2E Test', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const tempFolder = path.join(os.tmpdir(), 'seb-test', randomBytes(16).toString('hex'));

  afterAll(async () => {
    await fs.promises.rm(tempFolder, { recursive: true, force: true });
  });

  it('succeed for basic test app', async () => {
    const stageTempFolder = path.join(tempFolder, 'basic');
    const outputTempFolder = path.join(stageTempFolder, 'out');

    const pack_stdout = await runPackageBin('test', 'test-apps/basic', stageTempFolder, outputTempFolder);

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
      'test/test-apps/complex',
      '.',
      stageTempFolder,
      outputTempFolder,
      '--sources',
      '**/*.{js,cjs,mjs,json}',
      '../../other-package/**/*.{js,cjs,mjs,json}',
    );

    const outputFilePath = path.join(outputTempFolder, `complex-test-app.exe`);
    expect(fs.existsSync(outputFilePath)).toBe(true);
    expect(pack_stdout).toContain(pc.greenBright('SUCCESS'));

    const run_stdout = await runBootrapApp(stageTempFolder, outputFilePath);
    expect(run_stdout).toContain('Complex:');
    expect(run_stdout).toContain(pc.red('Hello'));
  }, 50_000);

  async function runPackageBin(
    cwd: string,
    appFolder: string,
    stageTempFolder: string,
    outputTempFolder: string,
    ...moreArgs: string[]
  ): Promise<string> {
    try {
      const { stdout, stderr } = await execa(
        'node',
        [
          path.join(__dirname, '../../dist/bin.js'),
          appFolder,
          '--stage-folder',
          stageTempFolder,
          '--output',
          outputTempFolder,
          '--debug',
          ...moreArgs,
        ],
        {
          cwd: cwd,
        },
      );
      printStdOutErr(stdout, stderr);
      return stdout;
    } catch (error) {
      if (error instanceof ExecaError) {
        printStdOutErr(error.stdout, error.stderr);
      }
      throw error;
    }
  }

  async function runBootrapApp(stageTempFolder: string, outputFilePath: string): Promise<string> {
    const { stdout, stderr } = await execa(outputFilePath, ['--seb-path', path.join(stageTempFolder, 'seb-app')]);
    printStdOutErr(stdout, stderr);
    return stdout;
  }

  function printStdOutErr(stdout?: string, stderr?: string): void {
    if (stdout) {
      console.log('--stdout--');
      console.log(stdout);
    }
    if (stderr) {
      console.log('--stderr--');
      console.log(stderr);
    }
  }
});
