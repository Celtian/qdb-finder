import { VERSION_INFO } from '../../../version-info';

const repository = 'https://github.com/Celtian/qdb-finder';
const version = VERSION_INFO.version;

export const siteMetadata = {
  version,
  versionLabel: `v${version}`,
  copyrightYear: new Date(VERSION_INFO.date).getUTCFullYear(),
  links: {
    repository,
    version: `${repository}/tree/v${version}`,
    latestRelease: `${repository}/releases/latest`,
    changelog: `${repository}/blob/master/CHANGELOG.md`,
    license: `${repository}/blob/master/LICENSE.md`,
  },
} as const;
