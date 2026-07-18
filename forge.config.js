const { version } = require('./package.json');

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: 'QDB Finder',
    icon: 'resources/icons/qdb-finder.ico',
    extraResource: ['resources/database'],
    ignore: [
      /^\/examples/,
      /^\/resources\/database/,
      /^\/projects/,
      /^\/tools/,
      /^\/docs/,
      /^\/\.git/,
      /^\/\.angular/,
      /^\/out/,
      /^\/node_modules\/quick-commitlint/,
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'qdb_finder',
        setupExe: 'QDB-Finder-Setup.exe',
        setupIcon: 'resources/icons/qdb-finder.ico',
      },
    },
    { name: '@electron-forge/maker-zip', platforms: ['win32'] },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: { owner: 'Celtian', name: 'qdb-finder' },
        draft: true,
        prerelease: version.includes('-'),
      },
    },
  ],
};
