import { RenderMode } from '@angular/ssr';

import { VERSION_INFO } from '../../../version-info';
import { routes } from './app.routes';
import { serverRoutes } from './app.routes.server';
import { documentationPages } from './pages/home/documentation';
import { Home } from './pages/home/home';
import { siteMetadata } from './site-metadata';

describe('documentation configuration', () => {
  const publicRoutes = routes.filter((route) => route.path !== '**');
  const paths = [
    '',
    'installation',
    'searching',
    'players',
    'teams-and-leagues',
    'referees-and-stadiums',
    'supported-data',
    'development',
    'database',
    'licensing',
    'releases',
  ];
  const slugs = paths.map((path) => path || 'overview');

  it('keeps the public routes, slugs and titles in their navigation order', () => {
    expect(publicRoutes.map((route) => route.path)).toEqual(paths);
    expect(publicRoutes.map((route) => route.data?.['slug'])).toEqual(slugs);
    expect(publicRoutes.map((route) => route.title)).toEqual([
      'Documentation · QDB Finder',
      'Installation · QDB Finder',
      'Searching and filters · QDB Finder',
      'Players · QDB Finder',
      'Teams and leagues · QDB Finder',
      'Referees and stadiums · QDB Finder',
      'Supported FIFA data · QDB Finder',
      'Development · QDB Finder',
      'Database generation · QDB Finder',
      'Licensing · QDB Finder',
      'Releases · QDB Finder',
    ]);
    expect(routes.at(-1)).toMatchObject({ path: '**', redirectTo: '' });
  });

  it('lazy-loads the shared documentation page for every public route', async () => {
    for (const route of publicRoutes) {
      expect(await route.loadComponent?.()).toBe(Home);
    }
  });

  it('provides content for every route and no unreachable pages', () => {
    expect(Object.keys(documentationPages)).toEqual(slugs);

    for (const slug of slugs) {
      expect(documentationPages[slug]).toMatchObject({
        eyebrow: expect.any(String),
        title: expect.any(String),
        lead: expect.any(String),
        sections: expect.any(Array),
      });
      expect(documentationPages[slug]?.sections.length).toBeGreaterThan(0);
    }
  });

  it('keeps every internal documentation link routable', () => {
    const knownPaths = new Set(paths.map((path) => `/${path}`));
    const links = Object.values(documentationPages).flatMap((page) =>
      page.sections.flatMap((section) => section.links ?? []),
    );

    for (const link of links) {
      if (link.external) {
        expect(link.href).toMatch(/^https:\/\//);
      } else {
        expect(knownPaths.has(link.href)).toBe(true);
      }
    }
  });

  it('prerenders every documentation route', () => {
    expect(serverRoutes).toEqual([{ path: '**', renderMode: RenderMode.Prerender }]);
  });

  it('derives immutable project links from the generated package version', () => {
    const repository = 'https://github.com/Celtian/qdb-finder';

    expect(siteMetadata).toEqual({
      version: VERSION_INFO.version,
      versionLabel: `v${VERSION_INFO.version}`,
      copyrightYear: new Date(VERSION_INFO.date).getUTCFullYear(),
      links: {
        repository,
        version: `${repository}/tree/v${VERSION_INFO.version}`,
        latestRelease: `${repository}/releases/latest`,
        changelog: `${repository}/blob/master/CHANGELOG.md`,
        license: `${repository}/blob/master/LICENSE.md`,
      },
    });
  });
});
