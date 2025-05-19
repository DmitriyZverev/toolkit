import fs, {Dirent, Stats} from 'node:fs';
import {EOL} from 'node:os';
import {resolve, join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

import ts, {CompilerOptions, SourceFile, type CompilerHost, type System, BufferEncoding} from 'typescript';

import {type Process} from '../../src/cli/process.js';
import {type Ts} from '../../src/services/createComiler.js';

export interface SystemFs {
    readdirSync(path: string, options: {withFileTypes: true}): Dirent[];
    statSync(path: string): Stats;
    statSync(path: string, options: {throwIfNoEntry: false}): Stats | undefined;
    mkdirSync(path: string, options: {recursive: true}): string | undefined;
    readFileSync(path: string, options: {encoding: BufferEncoding}): string;
    writeFileSync(path: string, data: string): void;
    realpathSync(path: string): string;
    unlinkSync(path: string): void;
    utimesSync(path: string, atime: Date, mtime: Date): void;
}

export interface CreateSystemArgs {
    process: Process;
    fs: SystemFs;
}

export type CreateSystem = (args: CreateSystemArgs) => System;

export const createSystem: CreateSystem = ({process, fs}) => {
    const getAccessibleFileSystemEntries = (path: string) => {
        try {
            const entries = fs.readdirSync(path, {withFileTypes: true});
            const files: string[] = [];
            const directories: string[] = [];
            for (const dirent of entries) {
                const {name} = dirent;
                if (name === '.' || name === '..') {
                    continue;
                }

                let stat: fs.Dirent | fs.Stats | undefined;
                if (dirent.isSymbolicLink()) {
                    stat = fs.statSync(join(path, name), {throwIfNoEntry: false});
                    if (!stat) {
                        continue;
                    }
                } else {
                    stat = dirent;
                }

                if (stat.isFile()) {
                    files.push(name);
                } else if (stat.isDirectory()) {
                    directories.push(name);
                }
            }
            files.sort();
            directories.sort();
            return {files, directories};
        } catch {
            return {
                files: [],
                directories: [],
            };
        }
    };

    return {
        args: process.argv.slice(2),
        newLine: EOL,
        exit(exitCode = 0) {
            process.exit(exitCode);
        },
        useCaseSensitiveFileNames: true,
        createDirectory(path) {
            fs.mkdirSync(path, {recursive: true});
        },
        directoryExists(path: string): boolean {
            try {
                return fs.statSync(path).isDirectory();
            } catch {
                return false;
            }
        },
        getCurrentDirectory() {
            return process.cwd();
        },
        getDirectories(path: string): string[] {
            return getAccessibleFileSystemEntries(path).directories;
        },
        getExecutingFilePath(): string {
            return '/node_modules/typescript/lib/tsc.js';
        },
        // eslint-disable-next-line max-params
        readDirectory(
            _path: string,
            _extensions?: readonly string[],
            _exclude?: readonly string[],
            _include?: readonly string[],
            _depth?: number,
        ): string[] {
            throw new Error('Not implemented');
        },
        fileExists(path) {
            try {
                return fs.statSync(path).isFile();
            } catch {
                return false;
            }
        },
        readFile(path, encoding) {
            const res = fs.readFileSync(path, {encoding: encoding as BufferEncoding});
            return res.toString();
        },
        writeFile(path, data) {
            const dir = dirname(path);
            fs.mkdirSync(dir, {recursive: true});
            fs.writeFileSync(path, data);
        },
        resolvePath(path) {
            return resolve(path);
        },
        write(message) {
            process.stdout.write(message);
        },
        realpath(path: string) {
            return fs.realpathSync(path);
        },
        // eslint-disable-next-line max-params
        watchFile(
            _path: string,
            _callback: ts.FileWatcherCallback,
            _pollingInterval?: number,
            _options?: ts.WatchOptions,
        ): ts.FileWatcher {
            throw new Error('Not implemented');
        },
        // eslint-disable-next-line max-params
        watchDirectory(
            _path: string,
            _callback: ts.DirectoryWatcherCallback,
            _recursive?: boolean,
            _options?: ts.WatchOptions,
        ): ts.FileWatcher {
            throw new Error('Not implemented');
        },
        deleteFile(path) {
            try {
                fs.unlinkSync(path);
            } catch {}
        },
        getFileSize(path) {
            const stat = fs.statSync(path, {throwIfNoEntry: false});
            if (stat?.isFile()) {
                return stat.size;
            }
            return 0;
        },
        setModifiedTime(path, time) {
            try {
                fs.utimesSync(path, time, time);
            } catch {}
        },
        getModifiedTime(path) {
            return fs.statSync(path, {throwIfNoEntry: false})?.mtime;
        },
    };
};

export const createCompilerHost = (sys: System, compilerOptions: CompilerOptions, process: Process): CompilerHost => {
    const sourceFiles = new Map<string, SourceFile>();
    const save = (sourceFile: SourceFile) => {
        sourceFiles.set(sourceFile.fileName, sourceFile);
        return sourceFile;
    };
    return {
        // eslint-disable-next-line max-params
        readDirectory(rootDir, extensions, excludes, includes, depth) {
            return sys.readDirectory(rootDir, extensions, excludes, includes, depth);
        },

        directoryExists(directoryName) {
            return sys.directoryExists(directoryName);
        },
        getDirectories(path) {
            return sys.getDirectories(path);
        },
        getCurrentDirectory() {
            return sys.getCurrentDirectory();
        },
        writeFile(fileName, text, writeByteOrderMark) {
            sys.writeFile(fileName, text, writeByteOrderMark);
        },
        fileExists(fileName) {
            return sys.fileExists(fileName);
        },
        getCanonicalFileName(fileName) {
            return fileName;
        },
        getDefaultLibFileName(options: CompilerOptions) {
            return join(dirname(sys.getExecutingFilePath()), ts.getDefaultLibFileName(options));
        },
        getNewLine() {
            return sys.newLine;
        },
        getSourceFile(fileName, languageVersionOrOptions) {
            return (
                sourceFiles.get(fileName) ??
                save(
                    ts.createSourceFile(
                        fileName,
                        sys.readFile(fileName)!,
                        languageVersionOrOptions ?? compilerOptions.target,
                        false,
                    ),
                )
            );
        },
        readFile(fileName) {
            return sys.readFile(fileName);
        },
        useCaseSensitiveFileNames() {
            return sys.useCaseSensitiveFileNames;
        },
        realpath: sys.realpath,
        getEnvironmentVariable(name) {
            return process.env[name];
        },
        getDefaultLibLocation(): string {
            return dirname(sys.getExecutingFilePath());
        },
    };
};

export const getLibFiles = async (rootPath: string) => {
    const dirName = dirname(fileURLToPath(import.meta.url));
    const libDir = resolve(dirName, '../../node_modules/typescript/lib');
    const allFileNames = await fs.promises.readdir(libDir);
    const libFileNames = allFileNames.filter((file) => file.startsWith('lib') && file.endsWith('.d.ts'));
    const entries = await Promise.all(
        libFileNames.map(async (fileName) => [
            join(rootPath, fileName),
            await fs.promises.readFile(join(libDir, fileName), 'utf8'),
        ]),
    );
    return Object.fromEntries(entries);
};

export interface MockTsArgs extends CreateSystemArgs {}

export type MockTs = (args: MockTsArgs) => Ts;

export const mockTs: MockTs = ({process, fs}) => {
    const sys = createSystem({process, fs});
    return {
        ...ts,
        sys,
        createCompilerHost(options) {
            return createCompilerHost(sys, options, process);
        },
    };
};
