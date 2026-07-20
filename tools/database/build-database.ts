import { resolve } from 'node:path';
import { buildDatabase, FIFAS } from './importer';

const root = resolve(process.cwd());
const summary = buildDatabase({
  sources: FIFAS.map((fifa) => ({ fifa, path: resolve(root, 'examples', fifa) })),
  outputPath: resolve(root, 'resources', 'database', 'qdb.sqlite'),
  databaseId: 'built-in',
  databaseName: 'Built-in FIFA 11–23',
  databaseKind: 'built-in',
  verifyExpectedCounts: process.env['QDB_SKIP_COUNT_CHECK'] !== '1',
  progress: (message) => console.log(message),
});
console.log(
  `Built qdb.sqlite: ${summary.playerEditions.toLocaleString()} player, ${summary.teamEditions.toLocaleString()} team, ${summary.leagueEditions.toLocaleString()} league, ${summary.refereeEditions.toLocaleString()} referee and ${summary.stadiumEditions.toLocaleString()} stadium editions from ${summary.sourceFiles} files.`,
);
