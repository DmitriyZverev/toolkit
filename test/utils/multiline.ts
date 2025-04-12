import {EOL} from 'node:os';

export const multiline = (...lines: string[]) => lines.join(EOL);
