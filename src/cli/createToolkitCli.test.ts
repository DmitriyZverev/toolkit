import {EOL} from 'node:os';

import {createProcess} from '../../test/utils/createProcess.js';
import {createLogger, error, info, Logger} from '../../test/utils/createLogger.js';
import {multiline} from '../../test/utils/multiline.js';
import {createFs} from '../../test/utils/createFs.js';
import {json} from '../../test/utils/json.js';
import {getLibFiles, mockTs} from '../../test/utils/mockTs.js';

import {createToolkitCli} from './createToolkitCli.js';
import {type Process} from './process.js';

const helpText = multiline(
    'Options:',
    '  -w, --work-dir  The working directory used to resolve all relative paths',
    '                                   [string] [default: Process working directory]',
    '  -h, --help      Show help                           [boolean] [default: false]',
    '  -v, --version   Show version number                 [boolean] [default: false]',
);

const isExecutable = (mode: number) => (mode & 0o111) !== 0;

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

describe('Package', () => {
    describe('Build', () => {
        const files = {
            '/package.json': json({
                name: 'test-package',
                description: 'Test package',
                version: '1.0.0',
                bin: {bin: './bin/bin.js'},
            }),
            '/LICENSE': 'MIT',
            '/README.md': '# Test package',
            '/index.ts': 'const foo: number = 1;',
            '/bin/bin.ts': 'console.log("Hello world");',
            '/tsconfig.json': json({files: ['index.ts', 'bin/bin.ts']}),
        };

        let libFiles: Record<string, string>;

        beforeAll(async () => {
            libFiles = await getLibFiles('/node_modules/typescript/lib');
        });

        test('Should build successfully', async () => {
            const process: Process = createProcess(['package', 'build']);
            const fs = createFs({files: {...libFiles, ...files}});
            const toolkit = createToolkitCli({
                fs,
                process,
                log: logger.log,
                ts: mockTs({fs, process}),
            });
            await toolkit.start();
            expect(logger.output.at(0)).toStrictEqual(info('Building package...'));
            expect(logger.output.at(-1)).toStrictEqual(info('Package built successfully.'));
            expect(process.exit).not.toHaveBeenCalled();
            expect(fs.toJSON()).toStrictEqual({
                ...libFiles,
                ...files,
                '/.package/package.json': files['/package.json'],
                '/.package/LICENSE': files['/LICENSE'],
                '/.package/README.md': files['/README.md'],
                '/.package/index.js': multiline('var foo = 1;', ''),
                '/.package/bin/bin.js': multiline('console.log("Hello world");', ''),
            });
            expect(isExecutable(fs.statSync('/.package/bin/bin.js').mode)).toBe(true);
        });

        test('Should not build because of nonexistent package.json', async () => {
            const process: Process = createProcess(['package', 'build']);
            const fs = createFs({
                files: {
                    ...libFiles,
                    '/LICENSE': files['/LICENSE'],
                    '/README.md': files['/README.md'],
                    '/index.ts': 'const foo: number = 1;',
                    '/tsconfig.json': json({files: ['index.ts']}),
                },
            });
            const toolkit = createToolkitCli({
                fs,
                process,
                log: logger.log,
                ts: mockTs({fs, process}),
            });
            await toolkit.start();
            expect(logger.output).toContainEqual(info('Building package...'));
            expect(logger.output).toContainEqual(error('Package build failed.'));
            expect(logger.output).toContainEqual(error("ENOENT: no such file or directory, open '/package.json'"));
            expect(process.exit).toHaveBeenCalledWith(1);
        });

        test('Should not build because of compilation errors', async () => {
            const process: Process = createProcess(['package', 'build']);
            const fs = createFs({
                files: {
                    ...files,
                    ...libFiles,
                    '/index.ts': 'const foo: string = 1;',
                },
            });
            const toolkit = createToolkitCli({
                fs,
                process,
                log: logger.log,
                ts: mockTs({fs, process}),
            });
            await toolkit.start();
            expect(logger.output).toContainEqual(info('Building package...'));
            expect(logger.output).toContainEqual(
                error(multiline(`index.ts(1,7): error TS2322: Type 'number' is not assignable to type 'string'.`, '')),
            );
            expect(logger.output).toContainEqual(error('Compilation failed.'));
            expect(logger.output).toContainEqual(error('Package build failed.'));
            expect(process.exit).toHaveBeenCalledWith(1);
        });
    });
});
