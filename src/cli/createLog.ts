import {EOL} from 'node:os';

import {defaultProcess, type ProcessWritableStream} from './process.js';

/**
 * @public
 */
export type LogType = 'error' | 'warning' | 'info' | 'debug';

/**
 * @public
 */
export type Log = (type: LogType, message: string) => void;

export interface LogProcess {
    readonly stdout: ProcessWritableStream;
    readonly stderr: ProcessWritableStream;
}

export interface CreateLogArgs {
    process?: LogProcess;
    newLine?: string;
}

export type CreateLog = (args?: CreateLogArgs) => Log;

export const createLog: CreateLog = ({process = defaultProcess, newLine = EOL} = {}) => {
    return function log(type, message) {
        switch (type) {
            case 'error':
                process.stderr.write(message + newLine);
                break;
            case 'warning':
            case 'info':
            case 'debug':
            default:
                process.stdout.write(message + newLine);
        }
    };
};
