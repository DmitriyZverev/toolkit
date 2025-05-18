import {createLog, type Log} from './createLog.js';
import {createCli} from './createCli.js';
import {defaultProcess, type Process} from './process.js';

/**
 * @public
 */
export interface CreateToolkitCliArgs {
    readonly process?: Process;
    readonly log?: Log;
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
    const cli = createCli({
        log,
        process,
        commands: {},
    });

    return {
        log,
        start: () => cli.start(),
    };
};
