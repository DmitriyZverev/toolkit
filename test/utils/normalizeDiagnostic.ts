import {type Diagnostic, type DiagnosticMessageChain, DiagnosticCategory} from 'typescript';

export interface NormalizedDiagnostic {
    code: number;
    category: DiagnosticCategory;
    messageText: string | DiagnosticMessageChain;
    start?: number;
    length?: number;
    file?: {fileName: string};
}

export type NormalizeDiagnostic = (diagnostic: Diagnostic) => NormalizedDiagnostic;

export const normalizeDiagnostic: NormalizeDiagnostic = (diagnostic) => {
    return {
        code: diagnostic.code,
        category: diagnostic.category,
        messageText: diagnostic.messageText,
        start: diagnostic.start,
        length: diagnostic.length,
        file: diagnostic.file ? {fileName: diagnostic.file.fileName} : undefined,
    };
};
