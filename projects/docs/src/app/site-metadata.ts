import packageMetadata from '../../../../package.json';

const repository = 'https://github.com/Celtian/qdb-finder';
const version = packageMetadata.version;

export const siteMetadata = {
  version,
  versionLabel: `v${version}`,
  links: {
    repository,
    version: `${repository}/tree/v${version}`,
    latestRelease: `${repository}/releases/latest`,
    changelog: `${repository}/blob/master/CHANGELOG.md`,
    license: `${repository}/blob/master/LICENSE.md`,
  },
} as const;
