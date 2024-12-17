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
import { glob } from 'glob';
import { configure } from '../src/config.js';
import { vol } from 'memfs';

vi.mock('fs', async () => (await vi.importActual('memfs'))['fs']);
vi.mock('glob');
vi.spyOn(process, 'cwd');

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
    vol.reset();
    vi.clearAllMocks();
  });

  function mockFileSystem(
    globMockValue: string[] = ['src\\index.js'],
    packageJsonMockValue: { name: string; main?: string } = {
      name: 'test-app',
      main: 'src\\index.js',
    },
    filesPathPrefix = '',
  ): void {
    (glob.glob as Mock).mockResolvedValue(globMockValue);
    vol.reset();
    vol.fromJSON(
      {
        [`${filesPathPrefix}package.json`]: JSON.stringify(packageJsonMockValue),
        [`${filesPathPrefix}index.js`]: 'console.log("Hello World!")',
      },
      '/virtual/my-app',
    );
    (process.cwd as Mock).mockReturnValue('/virtual/my-app');
  }

  it('should configure with valid inputs for defaults', async () => {
    mockFileSystem();

    const config = await configure('.', {
      output: 'out',
      target: 'win',
      debug: false,
      debugPkg: false,
      clean: false,
    });

    expect(config.appName).toBe('test-app');
    expect(config.appMain).toBe('src\\index.js');
    expect(config.appSources).toEqual(['src\\index.js']);
    expect(config.appPackagePath).toEqual('.');
    expect(config.appPackageJsonFile).toEqual('package.json');
    expect(config.appCommonAncestorPath).toEqual('\\virtual\\my-app');
    expect(config.targetPlatform).toEqual('win');
    expect(config.outputFilePath).toEqual('out\\test-app.exe');
    expect(config.debug).toBeFalsy();
    expect(config.debugPkg).toBeFalsy();
  });

  it('should configure with valid inputs for override options', async () => {
    mockFileSystem(['other\\bla\\code.js', 'other\\util.js'], undefined, 'other/');

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

    expect(config.appName).toBe('other-bla-app');
    expect(config.appMain).toBe('other\\bla\\code.js');
    expect(config.appSources).toEqual(['other\\bla\\code.js', 'other\\util.js']);
    expect(config.appPackagePath).toEqual('other');
    expect(config.appPackageJsonFile).toEqual('other\\package.json');
    expect(config.appCommonAncestorPath).toEqual('\\virtual\\my-app\\other');
    expect(config.targetPlatform).toEqual('other-mac');
    expect(config.outputFilePath).toEqual('other-out\\other-bla-app.exe');
    expect(config.debug).toBeTruthy();
    expect(config.debugPkg).toBeTruthy();
  });

  it('should configure common ancestor path with complex paths', async () => {
    mockFileSystem(['other\\bla\\code.js', 'other\\util.js', '..\\external\\app.js'], undefined, 'other/');

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

    expect(config.appName).toBe('other-bla-app');
    expect(config.appMain).toBe('other\\bla\\code.js');
    expect(config.appPackagePath).toEqual('other');
    expect(config.appPackageJsonFile).toEqual('other\\package.json');
    expect(config.appCommonAncestorPath).toEqual('\\virtual');
  });

  it('should configure with valid inputs', async () => {
    mockFileSystem();

    const config = await configure('.', mockOptions);

    expect(config.appName).toBe('test-app');
    expect(config.appMain).toBe('src\\index.js');
  });

  it('should normalize paths', async () => {
    mockFileSystem(['some\\path\\src\\index.js'], { name: 'test-app', main: 'src/index.js' }, 'some/path/');

    const config = await configure('some/path', mockOptions);

    expect(config.appName).toBe('test-app');
    expect(config.appMain).toBe('some\\path\\src\\index.js');
  });

  it('should handle specifying package.json', async () => {
    mockFileSystem(['some\\path\\src\\index.js'], undefined, 'some/path/');

    const config = await configure('some/path/package.json', mockOptions);

    expect(config.appName).toBe('test-app');
    expect(config.appMain).toBe('some\\path\\src\\index.js');
  });

  it('should throw error if package.json is not found', async () => {
    vol.reset();
    await expect(configure('path/to/package.json', mockOptions)).rejects.toThrow('package.json not found');
  });

  it('should throw error if no source files found', async () => {
    mockFileSystem([]);

    await expect(configure('.', mockOptions)).rejects.toThrow('No source files found');
  });

  it('should throw error if main entry point is misconfigured', async () => {
    mockFileSystem(['src/other.js'], undefined, 'path/to/');

    await expect(configure('path/to/package.json', mockOptions)).rejects.toThrow(
      'Main entry point "path\\to\\src\\index.js" was not found in sources',
    );
  });

  it('should handle using main from single source', async () => {
    mockFileSystem(['src\\main.js'], { name: 'test-app' });

    const config = await configure('.', mockOptions);

    expect(config.appName).toBe('test-app');
    expect(config.appMain).toBe('src\\main.js');
  });

  it('should throw error if main not provided', async () => {
    mockFileSystem(['src/main.js', 'src/other.js'], { name: 'test-app' });

    await expect(configure('.', mockOptions)).rejects.toThrow(
      'Unable to identify main entrypoint file, please specify the main',
    );
  });

  it('should create necessary folders', async () => {
    mockFileSystem();

    await configure('.', {
      output: 'out',
      target: 'win',
      debug: false,
      debugPkg: false,
      clean: false,
      stageFolder: '.packseb-cache',
    });

    expect(vol.existsSync('out')).toBeTruthy();
    expect(vol.existsSync('.packseb-cache')).toBeTruthy();
    expect(vol.existsSync('.packseb-cache\\app_sources')).toBeTruthy();
    expect(vol.existsSync('.packseb-cache\\app_node_modules')).toBeTruthy();
    expect(vol.existsSync('.packseb-cache\\bootstrap')).toBeTruthy();
  });
});
