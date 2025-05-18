import {EOL} from 'node:os';

import {createLog} from './createLog.js';

describe('defaultLog', () => {
    let outputMock: jest.SpyInstance;

    const mockOutput = (output: 'stderr' | 'stdout') => {
        outputMock = jest.spyOn(process[output], 'write').mockImplementation(() => true);
    };

    afterEach(() => {
        outputMock.mockRestore();
    });

    test('debug', () => {
        mockOutput('stdout');
        createLog()('debug', 'debug message');
        expect(outputMock).toHaveBeenCalledWith(`debug message${EOL}`);
    });

    test('error', () => {
        mockOutput('stderr');
        createLog()('error', 'error message');
        expect(outputMock).toHaveBeenCalledWith(`error message${EOL}`);
    });

    test('warning', () => {
        mockOutput('stdout');
        createLog()('warning', 'warning message');
        expect(outputMock).toHaveBeenCalledWith(`warning message${EOL}`);
    });

    test('info', () => {
        mockOutput('stdout');
        createLog()('info', 'info message');
        expect(outputMock).toHaveBeenCalledWith(`info message${EOL}`);
    });

    test('wrongType', () => {
        mockOutput('stdout');
        // @ts-expect-error TS2354
        createLog()('wrongType', 'wrong type message');
        expect(outputMock).toHaveBeenCalledWith(`wrong type message${EOL}`);
    });
});
