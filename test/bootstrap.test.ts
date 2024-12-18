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

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { vol } from 'memfs';
import mockRequire from 'mock-require';

mockRequire('fs', vol);
const decompressMock = vi.fn();
mockRequire('decompress', decompressMock);
const spawnMock = vi.fn();
mockRequire('child_process', { spawnSync: spawnMock });

const __dirname = join(dirname(fileURLToPath(import.meta.url)), '../lib');
const bootstrap = await import(join(__dirname, 'bootstrap.cjs'));

describe('bootstrap', () => {
  const testMetadata = {
    name: 'test-app',
    uuid: '1234',
    main: 'index.js',
    debug: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vol.reset();
  });

  function mockFileSystem(metadata: object, more: object = {}): void {
    vol.fromJSON({
      [join(__dirname, 'metadata.json')]: JSON.stringify(metadata),
      ...more,
    });
  }

  it('should create default temp folder', async () => {
    mockFileSystem({ ...testMetadata, debug: true });

    await bootstrap.default();

    expect(vol.existsSync(join(tmpdir(), 'node-single-executable-bootstrap-app'))).toBeTruthy();
  });

  it('should create setup app bootstrap on first call', async () => {
    mockFileSystem(testMetadata);

    await bootstrap.default(['--seb-path', '/temp']);

    expect(vol.existsSync('/temp')).toBeTruthy();
    const appFolder = join('/temp', 'test-app');

    expect(vol.existsSync(join(appFolder, 'metadata.json'))).toBeTruthy();
    expect(JSON.parse(vol.readFileSync(join(appFolder, 'metadata.json')) as string)).toEqual(testMetadata);

    expect(decompressMock).toHaveBeenCalledWith(expect.stringContaining('node.zip'), expect.any(String));
    expect(decompressMock).toHaveBeenCalledWith(expect.stringContaining('node_modules.zip'), expect.any(String));
    expect(decompressMock).toHaveBeenCalledWith(expect.stringContaining('app_sources.zip'), expect.any(String));

    expect(spawnMock).toHaveBeenCalledWith(
      expect.stringContaining(join(appFolder, 'node.exe')),
      [expect.stringContaining(join(appFolder, 'app', 'index.js'))],
      expect.any(Object),
    );
  });

  it('should NOT run setup if app already passed setup', async () => {
    const existingMetadata = { ...testMetadata, 'existing-extra': true };
    mockFileSystem(testMetadata, {
      '/temp/test-app/metadata.json': JSON.stringify(existingMetadata),
    });

    await bootstrap.default(['--seb-path', '/temp']);

    const appFolder = join('/temp', 'test-app');

    expect(vol.existsSync(join(appFolder, 'metadata.json'))).toBeTruthy();
    expect(JSON.parse(vol.readFileSync(join(appFolder, 'metadata.json')) as string)).toEqual(existingMetadata);

    expect(decompressMock).toBeCalledTimes(0);

    expect(spawnMock).toHaveBeenCalledWith(
      expect.stringContaining(join(appFolder, 'node.exe')),
      [expect.stringContaining(join(appFolder, 'app', 'index.js'))],
      expect.any(Object),
    );
  });

  it('should run setup if existing app is different uuid', async () => {
    const existingMetadata = { ...testMetadata, uuid: '9987654', 'existing-extra': true };
    mockFileSystem(testMetadata, {
      '/temp/test-app/metadata.json': JSON.stringify(existingMetadata),
    });

    await bootstrap.default(['--seb-path', '/temp']);

    const appFolder = join('/temp', 'test-app');

    expect(vol.existsSync(join(appFolder, 'metadata.json'))).toBeTruthy();
    expect(JSON.parse(vol.readFileSync(join(appFolder, 'metadata.json')) as string)).toEqual(testMetadata);

    expect(decompressMock).toBeCalledTimes(3);

    expect(spawnMock).toHaveBeenCalledWith(
      expect.stringContaining(join(appFolder, 'node.exe')),
      [expect.stringContaining(join(appFolder, 'app', 'index.js'))],
      expect.any(Object),
    );
  });

  it('should not clear console with debug', async () => {
    const consoleClearSpy = vi.spyOn(console, 'clear');

    mockFileSystem(testMetadata);

    await bootstrap.default();

    expect(consoleClearSpy).toBeCalledTimes(0);
  });

  it('should clear console without debug', async () => {
    const consoleClearSpy = vi.spyOn(console, 'clear');

    mockFileSystem({ ...testMetadata, debug: false });

    await bootstrap.default();

    expect(consoleClearSpy).toHaveBeenCalledOnce();
  });

  it('should log an error if an exception is thrown', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');

    try {
      await bootstrap.default();
    } catch {
      // Do nothing
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('!!!> Fatal error: '));
  });
});
