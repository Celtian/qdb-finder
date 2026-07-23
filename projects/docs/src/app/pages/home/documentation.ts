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
    title: 'Explore FIFA 11 through FIFA 23 in one place',
    lead: 'A fast, offline database explorer built for detailed, edition-specific discovery.',
    sections: [
      {
        title: 'Five connected finders',
        paragraphs: [
          'Browse the bundled FIFA 11 through FIFA 23 editions without learning table names or source-field codes. Every result represents one entity in one installed database and one FIFA edition.',
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
          'Detail dialogs link related records without losing the selected database or FIFA edition. Move from a player to every linked team, from a league to its players, teams or referees, and from a stadium to its teams.',
          'Context banners explain why a finder is constrained. Ordinary filters can still be combined with that context, and Clear returns to an unconstrained finder.',
        ],
      },
      {
        title: 'Local and inspectable',
        paragraphs: [
          'An optimized SQLite database ships with the desktop application, and compatible custom databases can be imported as isolated local copies. Searching needs no account or network connection, and raw source fields remain available in the final tab of every detail dialog.',
        ],
        links: [
          {
            label: 'Download the latest release',
            href: siteMetadata.links.latestRelease,
            external: true,
          },
          { label: 'Installation guide', href: '/installation' },
          { label: 'Databases and settings', href: '/databases-and-settings' },
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
        links: [{ label: 'Manage databases and settings', href: '/databases-and-settings' }],
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
    lead: 'Search as you type, then apply a precise set of composable filters.',
    sections: [
      {
        title: 'Database and edition records',
        paragraphs: [
          'A real-world player, team or venue can occur in several installed databases and FIFA editions. QDB Finder therefore keeps the database, FIFA version and Original ID together as the identity of a result.',
          'Enter a numeric Original ID by itself for an exact ID lookup, or use the main search box to find entity names and the additional player text documented by the player guide. The search updates as you type, and opening a result preserves its database and edition.',
        ],
      },
      {
        title: 'Apply exact filters',
        paragraphs: [
          'Open Filters to choose installed databases and FIFA editions or add category, autocomplete and numeric-range constraints. Autocomplete choices such as nationality, team, league and country resolve to exact database values and remain visible as removable selections.',
          'Changes are staged in the drawer. Apply runs one search from the first result page, Cancel discards the draft, and Clear all removes the draft filters before they are applied. Applied filters are saved locally for that finder; search text is not saved.',
        ],
        note: 'Selecting Women with FIFA 11–15 is valid and produces an empty result. QDB Finder never changes the selected editions automatically.',
      },
      {
        title: 'Columns, sorting and pagination',
        paragraphs: [
          'Columns opens a drawer containing every field available to that finder. Drag a column handle to change its position, or focus the handle and use the Up and Down arrow keys. The entity-name column remains visible.',
          'Apply saves both column visibility and order locally for that finder. Reset to defaults restores the default visibility and order.',
          'Sortable visible column headers order results inside SQLite before pagination. The result count and paginator describe the complete filtered population rather than only the 25, 50 or 100 rows currently visible.',
        ],
        items: [
          'Clearing the search box leaves applied filters and column choices unchanged.',
          'Applying filters returns to the first page without changing search text, page size or sorting.',
          'An empty state explains that no records match the current search and filters.',
          'Database errors show a retry action without discarding the current request.',
          'Wide result tables scroll horizontally on narrow windows instead of compressing values into overlapping columns.',
        ],
      },
      {
        title: 'Contextual finders',
        paragraphs: [
          'Actions in detail dialogs open another finder with an exact-database, exact-edition relationship constraint. A banner names the source context while ordinary filters continue to work within it.',
          'Clear on the context banner removes the relationship and applied filters while preserving search text, sort and page size. Changing the database filter also removes an incompatible context; incomplete or conflicting URL contexts are rejected.',
        ],
        links: guideLinks.slice(1),
      },
    ],
  },
  'databases-and-settings': {
    eyebrow: 'User guide',
    title: 'Databases and settings',
    lead: 'Manage local data sources, finder preferences and the application appearance.',
    sections: [
      {
        title: 'Search installed databases',
        paragraphs: [
          'The Databases page lists the protected built-in database and every custom database, including their supported FIFA editions, record totals and generated or imported date. Incompatible databases remain visible with an explanation but are excluded from search.',
          'Compatible databases are searched together by default. Open Filters in any finder to select one database, several databases or All databases; results and detail headers identify the database that supplied each record.',
        ],
      },
      {
        title: 'Import a custom database',
        paragraphs: [
          'The four-step wizard chooses a format and source, validates the data, then shows a final summary before creating output. Import either a folder that directly contains FIFA 11–23 text tables or a PC fifa_ng_db.db file together with its matching metadata XML.',
          'Direct t3db import supports PC format version 8. Xbox byte order, other binary versions, invalid metadata and incompatible schemas are rejected.',
        ],
        items: [
          'A uniquely detected FIFA edition is selected automatically; uncertain sources require a manual edition before validation.',
          'Validation scans structure, values, canonical identifiers, published ranges and relationships without creating output. Advisory metadata warnings remain importable.',
          'Validation and import can be cancelled. Temporary output is removed, and the selected source folder or files are never modified.',
          'A successful import creates an isolated SQLite file in the application-data directory and joins all-database searches immediately.',
        ],
      },
      {
        title: 'Remove custom data safely',
        paragraphs: [
          'Use the delete action on a Databases card to remove one custom database, or Settings to remove all custom databases after confirmation. The built-in database and every original source remain protected.',
          'Removing all custom databases also clears saved finder filters so they cannot retain database identifiers that no longer exist. A custom database created with an incompatible future QDB schema must be re-imported from its original source.',
        ],
      },
      {
        title: 'Appearance and finder preferences',
        paragraphs: [
          'Settings can follow the operating system appearance or force the light or dark application theme. The selected theme is saved locally.',
          'Each finder also saves its applied database and data filters plus its column visibility and order. Reset filters and columns clears those saved finder preferences, including the saved column order, after confirmation without changing search text, installed databases or the application theme.',
        ],
        links: [
          { label: 'Searching and filters', href: '/searching' },
          { label: 'Database generation for developers', href: '/database' },
        ],
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
          'Available columns cover the source database, Original ID, FIFA edition, nationality, linked teams, positions, birth date, contract end, age, height, weight, preferred foot, overall, potential and best position rating. Use Columns to choose which appear beside the required player name.',
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
          'Search team names or an exact numeric Original ID, then filter by FIFA edition, exact league, country, national-team status and overall, attack, midfield or defence rating ranges.',
          'Available columns cover the source database, Original ID, edition, country, national-team status, league, squad size and the four sortable rating measures. National teams take their country from the source team-to-nation link. Use Columns to choose which appear beside the required team name.',
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
          'Search league names or an exact numeric Original ID and filter by FIFA edition, country and competition tier. Available columns include the source database, Original ID, edition, country, tier, team count and player count.',
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
          'Available columns cover the source database, Original ID, edition, nationality, league assignments, birth date, age, height, weight and whether the official represents a real person. Use Columns to choose which appear beside the required referee name.',
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
          'Available columns cover the source database, Original ID, edition, country, linked-team count, capacity, construction year, pitch dimensions and licensing status. Use Columns to choose which appear beside the required stadium name.',
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
          'The bundled database validates 306 source files across 25 definitions and builds normalized, indexed records for the five searchable entity types.',
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
    eyebrow: 'Development',
    title: 'Deterministic database generation',
    lead: 'Release builds generate SQLite from the checked-in UTF-16LE TSV files.',
    sections: [
      {
        title: 'Build and validate',
        paragraphs: [
          'Headers, row structure, numeric values and canonical identifiers are checked against fifatables before raw tables, canonical indexes and the FTS5 player-search index are generated. Published range and relationship anomalies remain visible as advisory warnings for modified databases. Integrity, foreign-key, ANALYZE and VACUUM checks finish the build.',
        ],
        code: 'yarn db:build\nyarn db:validate',
      },
      {
        title: 'Read-only runtime',
        paragraphs: [
          'Electron opens searchable SQLite files read-only. Search values are parameterized, sort and table choices are constrained in code, and the renderer reaches the main-process query and import services only through the typed, sandboxed preload API.',
        ],
      },
      {
        title: 'Desktop imports',
        paragraphs: [
          'The desktop application reuses the same validation and normalized database builder for user-selected text folders and decoded PC t3db sources. Import and validation run outside the renderer and write only to an isolated temporary output before installation.',
        ],
        links: [{ label: 'Custom database user guide', href: '/databases-and-settings' }],
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
          'A matching v* tag installs from yarn.lock, generates and validates SQLite, runs checks, uploads the Squirrel and ZIP artifacts to a draft release, and then publishes it. Non-beta tags also deploy this prerendered documentation to GitHub Pages.',
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
