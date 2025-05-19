import type {Process, ProcessEnv} from '../../index.js';

export const createProcess = (argv: string[] = [], cwd: string = '/', env: ProcessEnv = {}) => {
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
        env,
    } satisfies Process;
};
