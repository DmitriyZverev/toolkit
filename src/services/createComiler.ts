import path from 'node:path';

import {
    type CompilerHost,
    type CompilerOptions,
    type CreateProgramOptions,
    type Diagnostic,
    type FormatDiagnosticsHost,
    type ParseConfigHost,
    type ParsedCommandLine,
    type Program,
    type System,
    type TsConfigSourceFile,
} from 'typescript';

export interface CompilationSuccessResult {
    hasErrors: false;
    diagnostics: Diagnostic[];
}

export interface CompilationErrorResult {
    hasErrors: true;
    diagnostics: Diagnostic[];
}

export type CompilationResult = CompilationSuccessResult | CompilationErrorResult;

export interface Compiler {
    compile(): CompilationResult;
    formatDiagnostics(...diagnostics: readonly Diagnostic[]): string;
}

/**
 * @public
 */
export interface Ts {
    sys: System;
    readJsonConfigFile(fileName: string, readFile: (path: string) => string | undefined): TsConfigSourceFile;
    parseJsonSourceFileConfigFileContent(
        sourceFile: TsConfigSourceFile,
        host: ParseConfigHost,
        basePath: string,
        existingOptions?: CompilerOptions,
    ): ParsedCommandLine;
    createCompilerHost(options: CompilerOptions): CompilerHost;
    createProgram(options: CreateProgramOptions): Program;
    getPreEmitDiagnostics(program: Program): readonly Diagnostic[];
    formatDiagnostics(diagnostics: readonly Diagnostic[], host: FormatDiagnosticsHost): string;
}

export interface CreateCompilerArgs {
    tsConfig: string;
    ts: Ts;
    outDir: string;
}

export type CreateCompiler = (args: CreateCompilerArgs) => Compiler;

export const createCompiler: CreateCompiler = ({ts, tsConfig, outDir}) => {
    const configFileDirectory = path.parse(tsConfig).dir;
    const configSourceFile = ts.readJsonConfigFile(tsConfig, ts.sys.readFile);
    const parsedConfig = ts.parseJsonSourceFileConfigFileContent(configSourceFile, ts.sys, configFileDirectory, {
        outDir,
    });
    const host = ts.createCompilerHost(parsedConfig.options);
    return {
        compile() {
            const program = ts.createProgram({
                options: parsedConfig.options,
                rootNames: parsedConfig.fileNames,
                configFileParsingDiagnostics: parsedConfig.errors,
                host,
            });
            const preEmitDiagnostics = ts.getPreEmitDiagnostics(program);
            const emitResult = program.emit();
            const diagnostics = [...emitResult.diagnostics, ...preEmitDiagnostics];
            const hasErrors = diagnostics.some(({category}) => category === 1);
            return {
                hasErrors,
                diagnostics,
            };
        },
        formatDiagnostics(...diagnostics) {
            return ts.formatDiagnostics(diagnostics, host);
        },
    };
};
