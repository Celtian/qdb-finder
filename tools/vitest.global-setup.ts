import { dirname, join } from 'node:path';
import ts from 'typescript';

export const setup = (): void => {
  const configPath = join(process.cwd(), 'projects', 'electron', 'tsconfig.electron.json');
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  if (configFile.error)
    throw new Error(ts.formatDiagnosticsWithColorAndContext([configFile.error], formatHost));
  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    dirname(configPath),
    undefined,
    configPath,
  );
  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const result = program.emit();
  const diagnostics = [...ts.getPreEmitDiagnostics(program), ...result.diagnostics];
  if (diagnostics.length)
    throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost));
};

const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (fileName) => fileName,
  getCurrentDirectory: () => process.cwd(),
  getNewLine: () => '\n',
};
