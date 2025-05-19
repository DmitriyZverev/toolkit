import fs from 'node:fs';

/**
 * @public
 */
export interface Fs {
    promises: {
        copyFile(src: string, dest: string): Promise<void>;
        rm(path: string, options?: {recursive?: boolean; force?: boolean}): Promise<void>;
        mkdir(path: string, options?: {recursive?: boolean}): Promise<string | undefined>;
        chmod(path: string, mode: string | number): Promise<void>;
        readFile(path: string): Promise<Buffer>;
    };
}

export const defaultFs: Fs = fs;
