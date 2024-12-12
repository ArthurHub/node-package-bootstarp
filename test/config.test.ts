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

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import * as fs from 'fs';
import { glob } from 'glob';
import { configure, Config } from '../src/config.js';

vi.mock('fs');
vi.mock('glob');

describe('configure', () => {
  const mockOptions = {
    name: 'test-app',
    output: 'out',
    target: 'node',
    debug: true,
    debugPkg: false,
    clean: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should configure with valid inputs for defaults', async () => {
    const mockPackageJson = JSON.stringify({ name: 'test-app', main: 'src\\index.js' });
    const mockGlob = ['src\\index.js'];

    (fs.existsSync as Mock).mockReturnValue(true);
    (fs.promises.readFile as Mock).mockResolvedValue(mockPackageJson);
    (glob.glob as Mock).mockResolvedValue(mockGlob);

    const config = await configure('.', {
      output: 'out',
      target: 'win',
      debug: false,
      debugPkg: false,
      clean: false,
    });

    expect(config).toBeInstanceOf(Config);
    expect(config.appName).toBe('test-app');
    expect(config.appMain).toBe('src\\index.js');
    expect(config.appSources).toEqual(['src\\index.js']);
    expect(config.appPackagePath).toEqual('.');
    expect(config.appPackageJsonFile).toEqual('package.json');
    expect(config.targetPlatform).toEqual('win');
    expect(config.outputFilePath).toEqual('out\\test-app.exe');
    expect(config.clean).toBeFalsy();
    expect(config.debug).toBeFalsy();
    expect(config.debugPkg).toBeFalsy();
  });

  it('should configure with valid inputs for override options', async () => {
    const mockPackageJson = JSON.stringify({ name: 'test-app', main: 'src\\index.js' });
    const mockGlob = ['other\\bla\\code.js', 'other\\util.js'];

    (fs.existsSync as Mock).mockReturnValue(true);
    (fs.promises.readFile as Mock).mockResolvedValue(mockPackageJson);
    (glob.glob as Mock).mockResolvedValue(mockGlob);

    const config = await configure('other', {
      sources: ['other/bla/**/*.js'],
      main: 'bla/code.js',
      name: 'other-bla-app',
      output: 'other-out',
      target: 'other-mac',
      debug: true,
      debugPkg: true,
      clean: true,
    });

    expect(config).toBeInstanceOf(Config);
    expect(config.appName).toBe('other-bla-app');
    expect(config.appMain).toBe('other\\bla\\code.js');
    expect(config.appSources).toEqual(['other\\bla\\code.js', 'other\\util.js']);
    expect(config.appPackagePath).toEqual('other');
    expect(config.appPackageJsonFile).toEqual('other\\package.json');
    expect(config.targetPlatform).toEqual('other-mac');
    expect(config.outputFilePath).toEqual('other-out\\other-bla-app.exe');
    expect(config.clean).toBeTruthy();
    expect(config.debug).toBeTruthy();
    expect(config.debugPkg).toBeTruthy();
  });

  it('should configure with valid inputs', async () => {
    const mockPackageJson = JSON.stringify({ name: 'test-app', main: 'src\\index.js' });
    const mockGlob = ['src\\index.js'];

    (fs.existsSync as Mock).mockReturnValue(true);
    (fs.promises.readFile as Mock).mockResolvedValue(mockPackageJson);
    (glob.glob as Mock).mockResolvedValue(mockGlob);

    const config = await configure('.', mockOptions);

    expect(config).toBeInstanceOf(Config);
    expect(config.appName).toBe('test-app');
    expect(config.appMain).toBe('src\\index.js');
  });

  it('should normalize paths', async () => {
    const mockPackageJson = JSON.stringify({ name: 'test-app', main: 'src/index.js' });
    const mockGlob = ['some\\path\\src\\index.js'];

    (fs.existsSync as Mock).mockReturnValue(true);
    (fs.promises.readFile as Mock).mockResolvedValue(mockPackageJson);
    (glob.glob as Mock).mockResolvedValue(mockGlob);

    const config = await configure('some/path', mockOptions);

    expect(config).toBeInstanceOf(Config);
    expect(config.appName).toBe('test-app');
    expect(config.appMain).toBe('some\\path\\src\\index.js');
  });

  it('should handle specifying package.json', async () => {
    const mockPackageJson = JSON.stringify({ name: 'test-app', main: 'src/index.js' });
    const mockGlob = ['some\\path\\src\\index.js'];

    (fs.existsSync as Mock).mockReturnValue(true);
    (fs.promises.readFile as Mock).mockResolvedValue(mockPackageJson);
    (glob.glob as Mock).mockResolvedValue(mockGlob);

    const config = await configure('some/path/package.JSON', mockOptions);

    expect(config).toBeInstanceOf(Config);
    expect(config.appName).toBe('test-app');
    expect(config.appMain).toBe('some\\path\\src\\index.js');
  });

  it('should throw error if package.json is not found', async () => {
    (fs.existsSync as Mock).mockReturnValue(false);
    await expect(configure('path/to/package.json', mockOptions)).rejects.toThrow('package.json not found');
  });

  it('should throw error if no source files found', async () => {
    const mockPackageJson = JSON.stringify({ name: 'test-app', main: 'src/index.js' });
    (fs.existsSync as Mock).mockReturnValue(true);
    (fs.promises.readFile as Mock).mockResolvedValue(mockPackageJson);
    (glob.glob as Mock).mockResolvedValue([]);

    await expect(configure('path/to/package.json', mockOptions)).rejects.toThrow('No source files found');
  });

  it('should throw error if main entry point is misconfigured', async () => {
    const mockPackageJson = JSON.stringify({ name: 'test-app', main: 'src/index.js' });
    (fs.existsSync as Mock).mockReturnValue(true);
    (fs.promises.readFile as Mock).mockResolvedValue(mockPackageJson);
    (glob.glob as Mock).mockResolvedValue(['src/other.js']);

    await expect(configure('path/to/package.json', mockOptions)).rejects.toThrow(
      'Main entry point "path\\to\\src\\index.js" was not found in sources',
    );
  });

  it('should handle using main from single source', async () => {
    (fs.existsSync as Mock).mockReturnValue(true);
    (fs.promises.readFile as Mock).mockResolvedValue(JSON.stringify({ name: 'test-app' }));
    (glob.glob as Mock).mockResolvedValue(['src\\main.js']);

    const config = await configure('.', mockOptions);

    expect(config).toBeInstanceOf(Config);
    expect(config.appName).toBe('test-app');
    expect(config.appMain).toBe('src\\main.js');
  });

  it('should throw error if main not provided', async () => {
    (fs.existsSync as Mock).mockReturnValue(true);
    (fs.promises.readFile as Mock).mockResolvedValue(JSON.stringify({ name: 'test-app' }));
    (glob.glob as Mock).mockResolvedValue(['src/main.js', 'src/other.js']);

    await expect(configure('path/to/package.json', mockOptions)).rejects.toThrow(
      'Unable to identify main entrypoint file, please specify the main',
    );
  });
});

describe('createFolders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create necessary folders', async () => {
    (fs.existsSync as Mock).mockReturnValueOnce(true).mockReturnValue(false);
    (fs.promises.readFile as Mock).mockResolvedValue(JSON.stringify({ name: 'test-app', main: 'src\\index.js' }));
    (glob.glob as Mock).mockResolvedValue(['src\\index.js']);
    fs.promises.mkdir = vi.fn();

    await configure('.', {
      output: 'out',
      target: 'win',
      debug: false,
      debugPkg: false,
      clean: false,
    });

    expect(fs.promises.mkdir).toHaveBeenCalledWith('.packseb-cache', { recursive: true });
    expect(fs.promises.mkdir).toHaveBeenCalledWith('out', { recursive: true });
    expect(fs.promises.mkdir).toHaveBeenCalledWith('.packseb-cache\\app_sources', { recursive: true });
    expect(fs.promises.mkdir).toHaveBeenCalledWith('.packseb-cache\\app_node_modules', { recursive: true });
  });
});
