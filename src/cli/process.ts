/**
 * @public
 */
export interface Process {
    readonly argv: string[];
    cwd(): string;
    exit(code: number): void;
}

export const defaultProcess: Process = process;
