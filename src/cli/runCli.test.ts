import {createLogger, debug, error, info, type Logger} from '../../test/utils/createLogger.js';
import {multiline} from '../../test/utils/multiline.js';
import {createProcess} from '../../test/utils/createProcess.js';

import {runCli, type Process, describeCommand} from './runCli.js';

const commands = {};
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

test('Should run command with default params correctly', async () => {
    const originalArgv = process.argv;
    process.argv = ['', '', 'command', '--option', 'foo'];
    const consoleMock = jest.spyOn(console, 'info').mockImplementation(() => {
        /**/
    });
    const message = (option: string) => `The command has been handled with option "${option}"`;
    await runCli({
        commands: {
            command: describeCommand({
                async builder({yargs}) {
                    return yargs.option('option', {type: 'string', default: ''});
                },
                async handler({args, services}) {
                    services.log('info', message(args.option));
                },
            }),
        },
    });
    expect(consoleMock).toHaveBeenCalledWith(message('foo'));
    process.argv = originalArgv;
    consoleMock.mockRestore();
});

describe('Help command', () => {
    test('Should show help', async () => {
        const process: Process = createProcess(['--help']);
        await runCli({process, log: logger.log, commands});
        expect(logger.output).toStrictEqual([info(helpText)]);
        expect(process.exit).not.toHaveBeenCalled();
    });

    test('Should show help (alias -h)', async () => {
        const process: Process = createProcess(['-h']);
        await runCli({process, log: logger.log, commands});
        expect(logger.output).toStrictEqual([info(helpText)]);
        expect(process.exit).not.toHaveBeenCalled();
    });
});

describe('Version command', () => {
    test('Should show version number', async () => {
        const {default: packageJson} = await import('../../package.json');
        const process: Process = createProcess(['--version']);
        await runCli({process, log: logger.log, commands});
        expect(logger.output).toStrictEqual([info(packageJson.version)]);
        expect(process.exit).not.toHaveBeenCalled();
    });

    test('Should show version number (alias -v)', async () => {
        const {default: packageJson} = await import('../../package.json');
        const process: Process = createProcess(['-v']);
        await runCli({process, log: logger.log, commands});
        expect(logger.output).toStrictEqual([info(packageJson.version)]);
        expect(process.exit).not.toHaveBeenCalled();
    });
});

describe('Error handling', () => {
    const message = 'Something wrong';

    test('Should handle unknown command correctly', async () => {
        const process: Process = createProcess(['unknown-command']);
        await runCli({process, log: logger.log, commands});
        expect(logger.output).toStrictEqual([info(helpText), error('Unknown argument: unknown-command')]);
        expect(process.exit).toHaveBeenCalledWith(2);
    });

    test('Should catch error from failed command', async () => {
        const process: Process = createProcess(['command']);
        await runCli({
            process,
            log: logger.log,
            commands: {
                command: {
                    async builder({yargs}) {
                        return yargs;
                    },
                    async handler() {
                        throw new Error(message);
                    },
                },
            },
        });
        expect(logger.output).toStrictEqual([error(message), debug(expect.any(String))]);
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    test('Should catch unknown error from failed command', async () => {
        const process: Process = createProcess(['command']);
        await runCli({
            process,
            log: logger.log,
            commands: {
                command: {
                    async builder({yargs}) {
                        return yargs;
                    },
                    async handler() {
                        throw message;
                    },
                },
            },
        });
        expect(logger.output).toStrictEqual([error(`Unknown error: ${message}`)]);
        expect(process.exit).toHaveBeenCalledWith(1);
    });
});

describe('Commands handling', () => {
    test('Should show command help', async () => {
        const process: Process = createProcess(['command', '--help']);
        const handler = jest.fn(() => Promise.resolve());
        await runCli({
            process,
            log: logger.log,
            commands: {
                command: {
                    description: 'Command description',
                    async builder({yargs}) {
                        return yargs.option('option', {type: 'string', description: 'Option description', default: ''});
                    },
                    handler,
                },
            },
        });
        expect(logger.output).toStrictEqual([
            info(
                multiline(
                    'toolkit command',
                    '',
                    'Command description',
                    '',
                    helpText,
                    '      --option    Option description                      [string] [default: ""]',
                ),
            ),
        ]);
        expect(handler).not.toHaveBeenCalled();
        expect(process.exit).not.toHaveBeenCalled();
    });

    test('Should handle command correctly', async () => {
        const process: Process = createProcess(['command', '--option', 'foo']);
        const message = (option: string) => `The command has been handled with option "${option}"`;
        await runCli({
            process,
            log: logger.log,
            commands: {
                command: describeCommand({
                    async builder({yargs}) {
                        return yargs.option('option', {type: 'string', default: ''});
                    },
                    async handler({args, services}) {
                        services.log('info', message(args.option));
                    },
                }),
            },
        });
        expect(logger.output).toStrictEqual([info(message('foo'))]);
        expect(process.exit).not.toHaveBeenCalled();
    });
});

describe('Subcommand handling', () => {
    test('Should show subcommand help', async () => {
        const process: Process = createProcess(['command', 'subcommand', '--help']);
        const commandHandler = jest.fn(() => Promise.resolve());
        const subCommandHandler = jest.fn(() => Promise.resolve());
        await runCli({
            process,
            log: logger.log,
            commands: {
                command: {
                    async builder({yargs, builder}) {
                        return yargs
                            .option('option-a', {type: 'string', description: 'Option A description', default: ''})
                            .command(
                                builder(yargs).command({
                                    command: 'subcommand',
                                    description: 'Subcommand description',
                                    async builder({yargs}) {
                                        return yargs.option('option-b', {
                                            type: 'string',
                                            description: 'Option B description',
                                            default: '',
                                        });
                                    },
                                    handler: subCommandHandler,
                                }),
                            );
                    },
                    handler: commandHandler,
                },
            },
        });
        expect(logger.output).toStrictEqual([
            info(
                multiline(
                    'toolkit command subcommand',
                    '',
                    'Subcommand description',
                    '',
                    helpText,
                    '      --option-a  Option A description                    [string] [default: ""]',
                    '      --option-b  Option B description                    [string] [default: ""]',
                ),
            ),
        ]);
        expect(subCommandHandler).not.toHaveBeenCalled();
        expect(commandHandler).not.toHaveBeenCalled();
        expect(process.exit).not.toHaveBeenCalled();
    });

    test('Should handle subcommand correctly', async () => {
        const process: Process = createProcess(['command', '--option-a', 'foo', 'subcommand', '--option-b', 'bar']);
        const commandHandler = jest.fn(() => Promise.resolve());
        const message = (optionA: string, optionB: string) =>
            `The subcommand has been handled with optionA: "${optionA}" and optionB: "${optionB}"`;
        await runCli({
            process,
            log: logger.log,
            commands: {
                command: {
                    async builder({yargs, builder}) {
                        const nextYargs = yargs.option('option-a', {type: 'string', default: ''});
                        return nextYargs.command(
                            builder(nextYargs).command({
                                command: 'subcommand',
                                description: 'Subcommand description',
                                async builder({yargs}) {
                                    return yargs.option('option-b', {type: 'string', default: ''});
                                },
                                async handler({args, services}) {
                                    services.log('info', message(args.optionA, args.optionB));
                                },
                            }),
                        );
                    },
                    handler: commandHandler,
                },
            },
        });
        expect(logger.output).toStrictEqual([info(message('foo', 'bar'))]);
        expect(commandHandler).not.toHaveBeenCalled();
        expect(process.exit).not.toHaveBeenCalled();
    });
});
