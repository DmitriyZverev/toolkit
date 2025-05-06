import path from 'node:path';

import yargs, {type Argv, type ArgumentsCamelCase, type CommandModule} from 'yargs';

import {type Log} from './log.js';
import {type Process} from './process.js';

export interface RootArgs {
    readonly 'work-dir': string;
    readonly help: boolean;
    readonly version: boolean;
}

export type BuildCommand<PrevArgs extends RootArgs> = <Args extends PrevArgs>(
    commandDescriptor: NamedCommandDescriptor<PrevArgs, Args>,
) => CommandModule<PrevArgs, Args>;

export type RootCommands<M extends Record<string, RootArgs>> = {
    [K in keyof M]: CommandDescriptor<RootArgs, M[K]>;
};

export interface RunCliArgs<M extends Record<string, RootArgs>> {
    readonly process: Process;
    readonly log: Log;
    readonly commands: RootCommands<M>;
}

export interface HandlerServices {
    readonly log: Log;
}

export interface CommandDescriptor<PrevArgs extends RootArgs, Args extends PrevArgs> {
    builder(params: {
        yargs: Argv<PrevArgs>;
        builder: <NextArgs extends PrevArgs>(yargs: Argv<NextArgs>) => {command: BuildCommand<NoInfer<NextArgs>>};
        services: HandlerServices;
    }): Promise<Argv<Args>>;
    handler(params: {args: ArgumentsCamelCase<NoInfer<Args>>; services: HandlerServices}): Promise<void>;
    readonly description?: string;
    readonly aliases?: readonly string[];
    readonly deprecated?: boolean;
}

export interface NamedCommandDescriptor<PrevArgs extends RootArgs, Args extends PrevArgs>
    extends CommandDescriptor<PrevArgs, Args> {
    readonly command: string;
}

export type RunCli = <M extends Record<string, RootArgs>>(args: RunCliArgs<M>) => Promise<void>;

type CreateCommandModule = <PrevArgs extends RootArgs, Args extends PrevArgs>(params: {
    readonly commandDescriptor: NamedCommandDescriptor<PrevArgs, Args>;
    readonly services: HandlerServices;
    readonly builder: <NextArgs extends PrevArgs>(yargs: Argv<NextArgs>) => {command: BuildCommand<NoInfer<NextArgs>>};
}) => CommandModule<PrevArgs, Args>;

class ValidationError extends Error {
    public getHelp: () => Promise<string>;

    constructor(message: string, getHelp: () => Promise<string>) {
        super(message);
        this.getHelp = getHelp;
    }
}

const createCommandModule: CreateCommandModule = ({commandDescriptor, services, builder}) => {
    return {
        command: commandDescriptor.command,
        aliases: commandDescriptor.aliases,
        describe: commandDescriptor.description,
        deprecated: commandDescriptor.deprecated,
        async builder(yargs) {
            return commandDescriptor.builder({yargs, builder, services});
        },
        async handler(args) {
            if (!args.help && !args.version) {
                await commandDescriptor.handler({args, services});
            }
        },
    };
};

export const describeCommand = <Args extends RootArgs>(desc: CommandDescriptor<RootArgs, Args>) => desc;

export const runCli: RunCli = async ({process, log, commands}) => {
    const argv = process.argv.slice(2);
    const cwd = process.cwd();
    const parentArgs = {
        workDir: cwd,
    };
    try {
        const yargsBuilder = yargs(argv, cwd)
            .scriptName('toolkit')
            .strict(true)
            .help(false)
            .version(false)
            .exitProcess(false)
            .locale('en')
            .option('work-dir', {
                alias: ['w'],
                description: 'The working directory used to resolve all relative paths',
                type: 'string',
                default: parentArgs.workDir,
                defaultDescription: 'Process working directory',
                coerce: (dir) => path.resolve(cwd, dir),
            })
            .option('help', {
                type: 'boolean',
                description: 'Show help',
                alias: ['h'],
                default: false,
            })
            .option('version', {
                type: 'boolean',
                alias: ['v'],
                description: 'Show version number',
                default: false,
            })
            .fail((message, err, yargs) => {
                if (err) {
                    throw err;
                } else {
                    throw new ValidationError(message, () => {
                        return new Promise((resolve) => {
                            yargs.showHelp(resolve);
                        });
                    });
                }
            });
        const commandEntries: [string, CommandDescriptor<RootArgs, RootArgs>][] = Object.entries(commands);
        const buildCommand: BuildCommand<RootArgs> = (commandDescriptor) =>
            createCommandModule({
                commandDescriptor,
                services: {log},
                builder() {
                    return {
                        get command() {
                            return buildCommand;
                        },
                    };
                },
            });
        const nextYargsBuilder = commandEntries
            .reduce((yargsBuilder, [command, commandDescriptor]) => {
                return yargsBuilder.command(
                    buildCommand({
                        ...commandDescriptor,
                        command,
                    }),
                );
            }, yargsBuilder)
            .middleware(async (argv) => {
                if (argv.help) {
                    yargsBuilder.showHelp((help) => {
                        log('info', help);
                    });
                } else if (argv.version) {
                    const {default: packageJson} = await import('../../package.json');
                    log('info', packageJson.version);
                }
            });
        await nextYargsBuilder.parseAsync();
    } catch (error) {
        if (error instanceof ValidationError) {
            log('info', await error.getHelp());
            log('error', error.message);
            process.exit(2);
        } else if (error instanceof Error) {
            log('error', error.message);
            if (error.stack) {
                log('debug', error.stack);
            }
            process.exit(1);
        } else {
            log('error', `Unknown error: ${error}`);
            process.exit(1);
        }
    }
};
