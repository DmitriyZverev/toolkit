import type {Process} from '../../index.js';

export const createProcess = (argv: string[] = [], cwd: string = '/') => {
    return {
        argv: ['', '', ...argv],
        cwd() {
            return cwd;
        },
        exit: jest.fn(),
        stdout: {
            write: jest.fn(),
        },
        stderr: {
            write: jest.fn(),
        },
    } satisfies Process;
};
