import path from 'node:path';

import {type CommandHandler, type NamedCommandDescriptor, type RootArgs} from '../../../../createCli.js';

export interface BuildArgs extends RootArgs {
    readonly 'out-dir': string;
    readonly tsconfig: string;
}

export interface CreateBuildCommandArgs {
    readonly handler: CommandHandler<BuildArgs>;
}

export type CreateBuildCommand = (args: CreateBuildCommandArgs) => NamedCommandDescriptor<RootArgs, BuildArgs>;

const DEFAULT_OUT_DIR_NAME = '.package';
const DEFAULT_TSCONFIG_FILE_NAME = 'tsconfig.json';

export const createBuildCommand: CreateBuildCommand = ({handler}) => {
    return {
        command: 'build',
        description: 'Compiles and bundles source files into a distributable NPM package',
        async builder({yargs}) {
            return yargs
                .option('out-dir', {
                    alias: 'o',
                    type: 'string',
                    description: 'The directory where the package will be built',
                    defaultDescription: path.join('<work-dir>', DEFAULT_OUT_DIR_NAME),
                    default: DEFAULT_OUT_DIR_NAME,
                })
                .option('tsconfig', {
                    alias: 'c',
                    type: 'string',
                    description: 'The path to the tsconfig.json file to use for compilation',
                    defaultDescription: path.join('<work-dir>', DEFAULT_TSCONFIG_FILE_NAME),
                    default: DEFAULT_TSCONFIG_FILE_NAME,
                })
                .middleware((args) => {
                    args.outDir = path.resolve(args.workDir, args.outDir);
                    args.tsconfig = path.resolve(args.workDir, args.tsconfig);
                });
        },
        handler,
    };
};
