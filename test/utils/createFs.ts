import {Volume} from 'memfs';

import {Fs} from '../../src/fs.js';

import {SystemFs} from './mockTs.js';

export interface CreateFsArgs {
    files: Record<string, string>;
}

export interface TestFs extends Fs, SystemFs {
    toJSON(): Record<string, string | null>;
}

export type CreateFs = (args: CreateFsArgs) => TestFs;

export const createFs: CreateFs = ({files}) => Volume.fromJSON(files) as TestFs;
