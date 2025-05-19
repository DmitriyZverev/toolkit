/**
 * @public
 */
export interface ProcessWritableStream {
    write(buffer: string): void;
}

/**
 * @public
 */
export interface ProcessEnv {
    readonly [key: string]: string | undefined;
}

/**
 * @public
 */
export interface Process {
    readonly argv: string[];
    readonly stdout: ProcessWritableStream;
    readonly stderr: ProcessWritableStream;
    readonly env: ProcessEnv;
    cwd(): string;
    exit(code: number): void;
}

export const defaultProcess: Process = process;
