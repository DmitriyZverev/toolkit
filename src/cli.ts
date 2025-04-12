import path from 'node:path';

import yargs from 'yargs';

export interface RunCliArgs {
    argv: string[];
    cwd: string;
}

export type RunCli = (args: RunCliArgs) => void;

export const runCli: RunCli = ({argv, cwd}) => {
    yargs()
        .scriptName('toolkit')
        .help()
        .alias('version', 'v')
        .alias('help', 'h')
        .locale('en')
        .option('work-dir', {
            alias: ['w'],
            description: 'The working directory used to resolve all relative paths',
            type: 'string',
            default: cwd,
            defaultDescription: 'Process working directory',
            coerce: (dir) => path.resolve(cwd, dir),
        })
        .parse(argv);
};
