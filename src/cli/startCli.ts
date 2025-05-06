import {defaultLog, type Log} from './log.js';
import {createCli} from './createCli.js';
import {defaultProcess, type Process} from './process.js';

/**
 * @public
 */
export interface StartCliArgs {
    readonly process?: Process;
    readonly log?: Log;
}

/**
 * @public
 */
export type StartCli = (args?: StartCliArgs) => Promise<void>;

/**
 * @public
 */
export const startCli: StartCli = ({process = defaultProcess, log = defaultLog} = {}) => {
    return createCli({
        log,
        process,
        commands: {},
    }).start();
};
