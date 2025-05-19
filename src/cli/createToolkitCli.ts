import defaultTs from 'typescript';

import {defaultFs, Fs} from '../fs.js';
import {buildPackage} from '../services/buildPackage.js';
import {type Ts} from '../services/createComiler.js';

import {createLog, type Log} from './createLog.js';
import {createCli} from './createCli.js';
import {defaultProcess, type Process} from './process.js';
import {createBuildCommand} from './commands/package/commands/build/createBuildCommand.js';

/**
 * @public
 */
export interface CreateToolkitCliArgs {
    readonly process?: Process;
    readonly log?: Log;
    readonly fs?: Fs;
    readonly ts?: Ts;
}

/**
 * @public
 */
export interface ToolkitCli {
    readonly log: Log;
    start(): Promise<void>;
}

/**
 * @public
 */
export type CreateToolkitCli = (args?: CreateToolkitCliArgs) => ToolkitCli;

/**
 * @public
 */
export const createToolkitCli: CreateToolkitCli = (args = {}) => {
    const process = args.process ?? defaultProcess;
    const log = args.log ?? createLog({process});
    const fs = args.fs ?? defaultFs;
    const ts = args.ts ?? defaultTs;
    const cli = createCli({
        log,
        process,
        commands: {
            package: {
                async builder({yargs, builder}) {
                    return yargs.command(
                        builder(yargs).command(
                            createBuildCommand({
                                async handler({args: {outDir, workDir, tsconfig: tsConfig}, services: {log}}) {
                                    return buildPackage({
                                        fs,
                                        ts,
                                        log,
                                        outDir,
                                        tsConfig,
                                        workDir,
                                    });
                                },
                            }),
                        ),
                    );
                },
                /* istanbul ignore next */
                async handler() {
                    /* ... */
                },
            },
        },
    });

    return {
        log,
        start: () => cli.start(),
    };
};
