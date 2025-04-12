import type {Log, LogType} from '../../index.js';

export interface LogMessage {
    type: LogType;
    message: string;
}

export interface Logger {
    output: LogMessage[];
    log: Log;
}

export type CreateLogger = () => Logger;

export const createLogger: CreateLogger = () => {
    const output: LogMessage[] = [];
    const log: Log = (type, message) => {
        output.push({type, message});
    };
    return {
        output,
        log,
    };
};

export const error = (message: string) => Object.freeze({type: 'error', message});
export const info = (message: string) => Object.freeze({type: 'info', message});
export const debug = (message: string) => Object.freeze({type: 'debug', message});
