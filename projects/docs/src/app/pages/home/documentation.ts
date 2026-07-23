import { siteMetadata } from '../../site-metadata';

export interface DocLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface DocSection {
  title: string;
  paragraphs: readonly string[];
  items?: readonly string[];
  note?: string;
  code?: string;
  links?: readonly DocLink[];
}

export interface DocPage {
  eyebrow: string;
  title: string;
  lead: string;
  sections: readonly DocSection[];
}

const guideLinks: readonly DocLink[] = [
  { label: 'Search basics', href: '/searching' },
  { label: 'Player guide', href: '/players' },
  { label: 'Teams and leagues', href: '/teams-and-leagues' },
  { label: 'Referees and stadiums', href: '/referees-and-stadiums' },
];

export const documentationPages: Readonly<Record<string, DocPage>> = {
  overview: {
    eyebrow: 'QDB Finder',
    title: 'Search thirteen FIFA databases in one place',
    lead: 'A fast, read-only FIFA browser built for detailed, edition-specific discovery.',
    sections: [
      {
        title: 'Five connected finders',
        paragraphs: [
          'Browse the supplied FIFA 11 through FIFA 23 databases without learning table names or source-field codes. Every result represents one entity in one FIFA edition.',
        ],
        items: [
          'Players: names, nationalities, squads, positions, ratings and complete attribute details.',
          'Teams: competitions, countries, squad sizes, ratings, players and home stadiums.',
          'Leagues: countries, tiers, competition type, team and player counts, and assigned referees.',
          'Referees: identity, nationality, physical data, strictness values and league assignments.',
          'Stadiums: country, capacity, construction year, pitch dimensions, licensing and linked teams.',
        ],
        links: guideLinks,
      },
      {
        title: 'Follow the relationships',
        paragraphs: [
          'Detail dialogs link related records without losing the selected FIFA edition. Move from a player to every linked team, from a league to its players, teams or referees, and from a stadium to its teams.',
          'Context banners explain why a finder is constrained. Ordinary filters can still be combined with that context, and Reset returns to an unconstrained finder.',
        ],
      },
      {
        title: 'Local and inspectable',
        paragraphs: [
          'The optimized SQLite database ships with the desktop application. Searching needs no account or network connection, and raw source fields remain available in the final tab of every detail dialog.',
        ],
        links: [
          {
            label: 'Download the latest release',
            href: siteMetadata.links.latestRelease,
            external: true,
          },
          { label: 'Installation guide', href: '/installation' },
        ],
      },
    ],
  },
  installation: {
    eyebrow: 'Getting started',
    title: 'Install QDB Finder',
    lead: 'Windows x64 is the first supported desktop target.',
    sections: [
      {
        title: 'Choose a Windows package',
        paragraphs: [
          'Download the current build from GitHub Releases. Both distributions contain the desktop application and its generated FIFA database.',
        ],
        items: [
          'Squirrel installer: installs QDB Finder for the current Windows user and provides the standard installed-app experience.',
          'ZIP package: extract it to a folder and run the application without an installer.',
        ],
        links: [
          {
            label: 'Open the latest release',
            href: siteMetadata.links.latestRelease,
            external: true,
          },
        ],
      },
      {
        title: 'First launch',
        paragraphs: [
          'Initial builds are unsigned, so Windows SmartScreen may display a warning. Confirm that the package came from the Celtian/qdb-finder release page before choosing to run it.',
          'No separate database download or setup is required. Open the application and select Players, Teams, Leagues, Referees or Stadiums from the home screen or navigation menu.',
        ],
        note: 'The packaged application is offline-first. GitHub is needed to download updates, not to search the database.',
      },
      {
        title: 'Build from source',
        paragraphs: [
          'Developers can generate the database and run Electron from the repository instead of installing a release build.',
        ],
        links: [
          { label: 'Development setup', href: '/development' },
          {
            label: 'Browse the source',
            href: siteMetadata.links.repository,
            external: true,
          },
        ],
      },
    ],
  },
  searching: {
    eyebrow: 'User guide',
    title: 'Searching and filtering',
    lead: 'Start broad, then narrow edition records with immediate, composable filters.',
    sections: [
      {
        title: 'Edition records and original IDs',
        paragraphs: [
          'A real-world player, team or venue can occur once in every supported game. QDB Finder therefore treats FIFA version and Original ID together as the stable identity of a result.',
          'Enter a numeric Original ID by itself for an exact ID lookup, or use the main search box to find entity names and the additional text documented by each finder. Selecting a row opens the exact edition represented by that result.',
        ],
      },
      {
        title: 'Text search and exact filters',
        paragraphs: [
          'Text search is useful for discovery. Autocomplete filters such as nationality, team, league and country resolve to exact database values and remain visible as removable selections.',
          'Edition, category and numeric-range controls combine with text and exact selections. Filter changes search immediately, return to the first result page and never change another filter implicitly.',
        ],
        note: 'Selecting Women with FIFA 11–15 is valid and produces an empty result. QDB Finder never changes the selected editions automatically.',
      },
      {
        title: 'Sort, page and recover',
        paragraphs: [
          'Sortable column headers order results inside SQLite before pagination. The result count and paginator describe the complete filtered population rather than only the rows currently visible.',
        ],
        items: [
          'Reset clears the current finder’s filters and returns to its default sort and first page.',
          'An empty state distinguishes a broad search prompt from filters that have no matches.',
          'Database errors show a retry action without discarding the current request.',
          'Wide result tables scroll horizontally on narrow windows instead of compressing values into overlapping columns.',
        ],
      },
      {
        title: 'Contextual finders',
        paragraphs: [
          'Actions in detail dialogs open another finder with an exact-edition relationship constraint. A banner names the source context while ordinary filters continue to work within it.',
          'Reset removes both the relationship context and its URL parameters. Incomplete or conflicting contexts are rejected rather than producing ambiguous results.',
        ],
        links: guideLinks.slice(1),
      },
    ],
  },
  players: {
    eyebrow: 'User guide',
    title: 'Players',
    lead: 'Find a player edition, compare ratings and inspect the complete source record.',
    sections: [
      {
        title: 'Find and filter players',
        paragraphs: [
          'The player search box accepts an exact numeric Original ID, or covers player and alternate names as well as linked teams, leagues and countries. Exact filters can be combined freely.',
        ],
        items: [
          'FIFA editions, gender, nationalities, teams, leagues and playable positions.',
          'Minimum and maximum age, overall rating and potential rating.',
          'All, Men and Women gender choices; women player records are available from FIFA 16.',
        ],
        note: 'FIFA 11–15 source tables do not contain women player records and are normalized as Men.',
      },
      {
        title: 'Read the results',
        paragraphs: [
          'Each row shows the player name, Original ID, FIFA edition, nationality, linked teams, positions, age, overall, potential and best position rating.',
          'Position pills keep their football-role colors. Rating pills use shared red-to-green value bands, making score comparisons consistent throughout the app.',
        ],
      },
      {
        title: 'Player details',
        paragraphs: [
          'The summary keeps overall, potential, best rating and age visible above four detail tabs.',
        ],
        items: [
          'Profile: full and display names, readable birth and snapshot dates, height, weight, preferred foot and work rates.',
          'Position matrix: every supported position in a pitch-aligned layout, including separate sweeper and goalkeeper rows; tile colors reflect the rating value.',
          'Attributes: Attacking, Skill, Movement, Power, Mentality, Defending, Goalkeeping and Special groups, with potential and a numeric five-star international reputation.',
          'Raw fields: the untouched source keys and values for the selected FIFA player table record.',
        ],
      },
      {
        title: 'View linked teams',
        paragraphs: [
          'The persistent View teams action opens every squad linked to that exact player edition, including club, national and special teams. The Teams finder displays the player context and lets normal team filters refine it.',
        ],
        links: [
          { label: 'Search basics', href: '/searching' },
          { label: 'Teams and leagues guide', href: '/teams-and-leagues' },
        ],
      },
    ],
  },
  'teams-and-leagues': {
    eyebrow: 'User guide',
    title: 'Teams and leagues',
    lead: 'Compare squads and competitions while keeping every relationship edition-specific.',
    sections: [
      {
        title: 'Team finder',
        paragraphs: [
          'Search team names or an exact numeric Original ID, then filter by FIFA edition, exact league, country and overall, attack, midfield or defence rating ranges.',
          'Results show Original ID, edition, country, league, squad size and the four sortable rating measures.',
        ],
      },
      {
        title: 'Team details and actions',
        paragraphs: [
          'The team summary includes its ratings, squad size and foundation year. Overview shows a top-rated squad preview and the linked home stadium when available; Raw fields preserves the source team record.',
        ],
        items: [
          'View all players opens the complete exact-edition squad in the Players finder.',
          'View stadium opens the linked home ground when the source data supplies one.',
          'Team results can also be constrained by a player, league or stadium context.',
        ],
      },
      {
        title: 'League finder',
        paragraphs: [
          'Search league names or an exact numeric Original ID and filter by FIFA edition, country and competition tier. Results include Original ID, edition, country, tier, team count and player count.',
          'League details identify men’s or women’s competition data and preview both top-rated teams and assigned referees before the Raw fields tab.',
        ],
      },
      {
        title: 'Move through a competition',
        paragraphs: [
          'League actions open the complete exact-edition population of teams, referees or players. A referee detail can return to its assigned leagues, so the context remains traceable in either direction.',
        ],
        links: [
          { label: 'Player guide', href: '/players' },
          { label: 'Referees and stadiums guide', href: '/referees-and-stadiums' },
        ],
      },
    ],
  },
  'referees-and-stadiums': {
    eyebrow: 'User guide',
    title: 'Referees and stadiums',
    lead: 'Inspect officials and venues together with their exact competition and team links.',
    sections: [
      {
        title: 'Referee finder',
        paragraphs: [
          'Search referee names or an exact numeric Original ID and filter by FIFA edition, gender, nationality, assigned league, age range and real or generic referee type.',
          'Results show Original ID, edition, nationality, league assignments, age, height and whether the official represents a real person.',
        ],
        note: 'Women referee data is available from FIFA 16. FIFA 11–15 records are treated as Men because those source tables have no gender field.',
      },
      {
        title: 'Referee details',
        paragraphs: [
          'Summary metrics cover age, height, weight, real-referee status and foul/card strictness. Overview lists linked league editions, Raw fields exposes the source record, and View leagues opens the complete assignment set.',
        ],
      },
      {
        title: 'Stadium finder',
        paragraphs: [
          'Search stadium names or an exact numeric Original ID and filter by FIFA edition, country, exact linked team, capacity range and licensed or generic stadium type.',
          'Results show Original ID, edition, country, linked-team count, capacity, construction year, pitch dimensions and licensing status.',
        ],
      },
      {
        title: 'Stadium details and teams',
        paragraphs: [
          'The stadium summary includes capacity, year built, pitch size, linked-team count, licensing and small-sided status. Overview previews linked teams and Raw fields preserves the source stadium data.',
          'View teams opens all teams associated with that exact stadium edition and keeps the stadium named in the finder context.',
        ],
        links: [
          { label: 'Search basics', href: '/searching' },
          { label: 'Teams and leagues guide', href: '/teams-and-leagues' },
        ],
      },
    ],
  },
  'supported-data': {
    eyebrow: 'Data coverage',
    title: 'FIFA 11 through FIFA 23',
    lead: 'Every supplied table covered by fifatables 0.2.10 is preserved.',
    sections: [
      {
        title: 'Canonical searchable data',
        paragraphs: [
          'The generated database validates 306 source files across 25 definitions and builds normalized, indexed records for the five searchable entity types.',
        ],
        items: [
          '227,572 player editions and 241,640 team-player links.',
          '8,907 team editions and 8,890 stadium-team links.',
          '560 league editions and 3,001 referee-league links.',
          '2,516 referee editions and 1,371 stadium editions.',
        ],
      },
      {
        title: 'Historical variation',
        paragraphs: [
          'Older FIFA editions can contain fewer attributes or relationships than newer games. QDB Finder preserves sparse values, keeps pitch positions stable and displays unavailable presentation fields as an em dash.',
          'Raw fields retain the source-table vocabulary for research and troubleshooting even when the normalized interface uses more readable labels.',
        ],
      },
    ],
  },
  development: {
    eyebrow: 'Contributing',
    title: 'Development commands',
    lead: 'Node 24.18 and Yarn Classic 1.22.22 are the supported toolchain.',
    sections: [
      {
        title: 'Run and verify',
        paragraphs: [
          'Generate the database before starting Electron and run the complete validation before publishing changes.',
        ],
        code: 'yarn install --frozen-lockfile\nyarn db:build\nyarn start\n\nyarn format:check\nyarn lint\nyarn test\nyarn build',
        links: [
          {
            label: 'Browse the repository',
            href: siteMetadata.links.repository,
            external: true,
          },
        ],
      },
    ],
  },
  database: {
    eyebrow: 'Importer',
    title: 'Deterministic database generation',
    lead: 'Release builds generate SQLite from the checked-in UTF-16LE TSV files.',
    sections: [
      {
        title: 'Build and validate',
        paragraphs: [
          'Headers, row structure, numeric values and canonical identifiers are checked against fifatables before raw tables, canonical indexes and FTS5 are generated. Published range and relationship anomalies remain visible as advisory warnings for modified databases. Integrity, foreign-key, ANALYZE and VACUUM checks finish the build.',
        ],
        code: 'yarn db:build\nyarn db:validate',
      },
      {
        title: 'Read-only runtime',
        paragraphs: [
          'Electron opens the generated SQLite artifact read-only. Search values are parameterized, and the renderer reaches data only through the typed, sandboxed preload API.',
        ],
      },
      {
        title: 'Custom database library',
        paragraphs: [
          'The desktop Databases wizard imports one FIFA 11–23 edition at a time from either an exported text-table folder or a PC fifa_ng_db.db file with its matching metadata XML. PC t3db format version 8 is decoded through fifa-t3db; Xbox and other binary formats are rejected.',
          'QDB Finder automatically selects a uniquely detected FIFA edition or asks for a manual choice when detection is uncertain. Validate performs a cancellable read-only scan and reports corrupted text rows by line and t3db rows by record. Advisory metadata warnings do not block modified databases, but a manual edition choice never bypasses schema compatibility checks.',
          'Every import becomes an isolated SQLite file in the application-data directory. The bundled database stays immutable, compatible databases are searched together by default, cancellation removes temporary output, and deleting an import never changes the selected source files.',
        ],
        note: 'A generated database with an incompatible QDB schema remains listed but is excluded from search; re-import its original source with the current application version.',
      },
    ],
  },
  licensing: {
    eyebrow: 'Legal',
    title: 'Licensing and data',
    lead: 'Application code and the three FIFA helper libraries are MIT licensed.',
    sections: [
      {
        title: 'Application license',
        paragraphs: [
          'The QDB Finder source code is available under the MIT License. Contributions are accepted under the repository’s contribution and conduct policies.',
        ],
        links: [
          {
            label: 'Read the MIT License',
            href: siteMetadata.links.license,
            external: true,
          },
        ],
      },
      {
        title: 'Data redistribution',
        paragraphs: [
          'Redistributors remain responsible for confirming that supplied FIFA game database content may legally be shipped in their jurisdiction.',
        ],
      },
    ],
  },
  releases: {
    eyebrow: 'Distribution',
    title: 'GitHub Releases',
    lead: 'Version tags create reproducible Windows x64 artifacts and static documentation.',
    sections: [
      {
        title: 'Release flow',
        paragraphs: [
          'A matching v* tag installs from yarn.lock, generates and validates SQLite, runs checks, creates Squirrel and ZIP artifacts and publishes a draft release. Stable tags also deploy this prerendered documentation to GitHub Pages.',
          `This documentation build identifies itself as ${siteMetadata.versionLabel} and links to the immutable source tag used to produce it.`,
        ],
        links: [
          {
            label: `Source for ${siteMetadata.versionLabel}`,
            href: siteMetadata.links.version,
            external: true,
          },
          {
            label: 'Latest download',
            href: siteMetadata.links.latestRelease,
            external: true,
          },
          {
            label: 'Changelog',
            href: siteMetadata.links.changelog,
            external: true,
          },
        ],
      },
    ],
  },
};
