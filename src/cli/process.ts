/**
 * @public
 */
export interface ProcessWritableStream {
    write(buffer: string): void;
}

/**
 * @public
 */
export interface Process {
    readonly argv: string[];
    readonly stdout: ProcessWritableStream;
    readonly stderr: ProcessWritableStream;
    cwd(): string;
    exit(code: number): void;
}

export const defaultProcess: Process = process;
