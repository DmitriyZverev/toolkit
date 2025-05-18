import {EOL} from 'node:os';

import {createProcess} from '../../test/utils/createProcess.js';
import {createLogger, info, Logger} from '../../test/utils/createLogger.js';
import {multiline} from '../../test/utils/multiline.js';

import {createToolkitCli} from './createToolkitCli.js';
import {type Process} from './process.js';

const helpText = multiline(
    'Options:',
    '  -w, --work-dir  The working directory used to resolve all relative paths',
    '                                   [string] [default: Process working directory]',
    '  -h, --help      Show help                           [boolean] [default: false]',
    '  -v, --version   Show version number                 [boolean] [default: false]',
);

let logger: Logger;

beforeEach(() => {
    logger = createLogger();
});

describe('Help command', () => {
    test('Should display the help message correctly by default', async () => {
        const originalArgv = process.argv;
        process.argv = ['', '', '--help'];
        const stdoutMock = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
        await createToolkitCli().start();
        expect(stdoutMock).toHaveBeenCalledWith(helpText + EOL);
        process.argv = originalArgv;
        stdoutMock.mockRestore();
    });

    test('Should display the help message correctly', async () => {
        const process: Process = createProcess(['--help']);
        const toolkit = createToolkitCli({process, log: logger.log});
        await toolkit.start();
        expect(logger.output).toStrictEqual([info(helpText)]);
        expect(process.exit).not.toHaveBeenCalled();
    });
});
