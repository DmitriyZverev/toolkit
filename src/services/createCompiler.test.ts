import {json} from '../../test/utils/json.js';
import {multiline} from '../../test/utils/multiline.js';
import {getLibFiles, mockTs} from '../../test/utils/mockTs.js';
import {type Entries, findEntriesDiff} from '../../test/utils/findEntriesDiff.js';
import {normalizeDiagnostic} from '../../test/utils/normalizeDiagnostic.js';
import {createFs} from '../../test/utils/createFs.js';
import {createProcess} from '../../test/utils/createProcess.js';

import {type CompilationResult, type CreateCompilerArgs, createCompiler} from './createComiler.js';

interface PrepareSnapshotDataArgs {
    compilationResult: CompilationResult;
    files: Record<string, string | null>;
    initFiles: Entries<string, string>;
}

const prepareSnapshotData = (args: PrepareSnapshotDataArgs) => ({
    compilationResult: {
        ...args.compilationResult,
        diagnostics: args.compilationResult.diagnostics.map(normalizeDiagnostic),
    },
    files: Object.fromEntries(findEntriesDiff(args.initFiles, args.files)),
});

const cases: [{[filePath: string]: string}, Omit<CreateCompilerArgs, 'ts'>][] = [
    [
        {
            '/index.ts': 'const foo: number = 1;',
            '/tsconfig.json': json({files: ['index.ts']}),
        },
        {tsConfig: '/tsconfig.json', outDir: '/'},
    ],
    [
        {
            '/index.ts': 'const foo: string = 1;',
            '/tsconfig.json': json({files: ['index.ts']}),
        },
        {tsConfig: '/tsconfig.json', outDir: '/'},
    ],
];

let tsLibFiles: Record<string, string> = {};

beforeAll(async () => {
    tsLibFiles = await getLibFiles('/node_modules/typescript/lib');
});

test.each(cases)('%#', (initFiles, {tsConfig}) => {
    const files = {...initFiles, ...tsLibFiles};
    const process = createProcess([]);
    const fs = createFs({files});
    const ts = mockTs({fs, process});
    const compilationResult = createCompiler({ts, tsConfig, outDir: '/'}).compile();
    expect(prepareSnapshotData({compilationResult, files: fs.toJSON(), initFiles: files})).toMatchSnapshot();
});

test('Format diagnostics', () => {
    const files = {
        ...tsLibFiles,
        '/index.ts': multiline('const foo: string = 1;', 'const bar: number = "";'),
        '/tsconfig.json': json({files: ['index.ts']}),
    };
    const process = createProcess([]);
    const fs = createFs({files});
    const ts = mockTs({fs, process});
    const compiler = createCompiler({ts, tsConfig: '/tsconfig.json', outDir: '/'});
    const {diagnostics} = compiler.compile();
    expect(diagnostics.map((diagnostic) => compiler.formatDiagnostics(diagnostic))).toMatchSnapshot();
});
