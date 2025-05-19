import path from 'node:path';

import {Log} from '../cli/createLog.js';
import {Fs} from '../fs.js';

import {createCompiler, type Ts} from './createComiler.js';

export interface BuildPackageArgs {
    readonly workDir: string;
    readonly outDir: string;
    readonly tsConfig: string;
    readonly log: Log;
    readonly fs: Fs;
    readonly ts: Ts;
}

export type BuildPackage = (args: BuildPackageArgs) => Promise<void>;

const diagnosticCategoryMap = Object.freeze({
    [0]: 'warning',
    [1]: 'error',
    [2]: 'info',
    [3]: 'info',
});

const cleanOutDir = async ({outDir, fs}: {outDir: string; fs: Fs}) => {
    await fs.promises.rm(outDir, {recursive: true, force: true});
    await fs.promises.mkdir(outDir, {recursive: true});
};

const copyPackageJson = ({workDir, outDir, fs}: {workDir: string; outDir: string; fs: Fs}) => {
    return fs.promises.copyFile(path.resolve(workDir, 'package.json'), path.resolve(outDir, 'package.json'));
};

const copyLicense = ({workDir, outDir, fs}: {workDir: string; outDir: string; fs: Fs}) => {
    return fs.promises.copyFile(path.resolve(workDir, 'LICENSE'), path.resolve(outDir, 'LICENSE'));
};

const copyReadme = ({workDir, outDir, fs}: {workDir: string; outDir: string; fs: Fs}) => {
    return fs.promises.copyFile(path.resolve(workDir, 'README.md'), path.resolve(outDir, 'README.md'));
};

const compile = async ({tsConfig, ts, outDir, log}: {tsConfig: string; log: Log; outDir: string; ts: Ts}) => {
    const compiler = createCompiler({ts, tsConfig, outDir});
    const result = compiler.compile();
    result.diagnostics.forEach((diagnostic) => {
        log(diagnosticCategoryMap[diagnostic.category], compiler.formatDiagnostics(diagnostic));
    });
    if (result.hasErrors) {
        throw new Error('Compilation failed.');
    }
};

const makeBinFilesExecutable = async ({outDir, fs}: {fs: Fs; outDir: string}) => {
    const packageInfo: unknown = JSON.parse((await fs.promises.readFile(path.join(outDir, 'package.json'))).toString());
    if (
        packageInfo &&
        typeof packageInfo === 'object' &&
        'bin' in packageInfo &&
        typeof packageInfo.bin === 'object' &&
        packageInfo.bin !== null
    ) {
        const binFiles = Object.values(packageInfo.bin).filter((filePath) => typeof filePath === 'string');
        await Promise.all(
            binFiles.map(async (filePath) => {
                return fs.promises.chmod(path.join(outDir, filePath), 0o755);
            }),
        );
    }
};

export const buildPackage: BuildPackage = async ({log, tsConfig, outDir, workDir, fs, ts}) => {
    try {
        log('info', 'Building package...');
        await cleanOutDir({outDir, fs});
        await Promise.all([
            copyPackageJson({workDir, outDir, fs}),
            copyLicense({workDir, outDir, fs}),
            copyReadme({workDir, outDir, fs}),
            compile({tsConfig, outDir, log, ts}),
        ]);
        await makeBinFilesExecutable({fs, outDir});
        log('info', 'Package built successfully.');
    } catch (error) {
        log('error', 'Package build failed.');
        throw error;
    }
};
