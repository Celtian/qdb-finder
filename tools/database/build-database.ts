import { resolve } from 'node:path';
import { buildDatabase } from './importer';

const root = resolve(process.cwd());
const summary = buildDatabase({
  examplesPath: resolve(root, 'examples'),
  outputPath: resolve(root, 'resources', 'database', 'qdb.sqlite'),
  verifyExpectedCounts: process.env['QDB_SKIP_COUNT_CHECK'] !== '1',
});
console.log(
  `Built qdb.sqlite: ${summary.playerEditions.toLocaleString()} player, ${summary.teamEditions.toLocaleString()} team, ${summary.leagueEditions.toLocaleString()} league, ${summary.refereeEditions.toLocaleString()} referee and ${summary.stadiumEditions.toLocaleString()} stadium editions from ${summary.sourceFiles} files.`,
);
