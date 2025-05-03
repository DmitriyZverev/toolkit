import {defaultLog} from './log.js';

describe('defaultLog', () => {
    let consoleMock: jest.SpyInstance;

    const mockConsole = (method: 'debug' | 'warn' | 'info' | 'error' | 'log') => {
        consoleMock = jest.spyOn(console, method).mockImplementation(() => {
            /**/
        });
    };

    afterEach(() => {
        consoleMock.mockRestore();
    });

    test('debug', () => {
        mockConsole('debug');
        defaultLog('debug', 'debug message');
        expect(consoleMock).toHaveBeenCalledWith('debug message');
    });

    test('error', () => {
        mockConsole('error');
        defaultLog('error', 'error message');
        expect(consoleMock).toHaveBeenCalledWith('error message');
    });

    test('warning', () => {
        mockConsole('warn');
        defaultLog('warning', 'warning message');
        expect(consoleMock).toHaveBeenCalledWith('warning message');
    });

    test('info', () => {
        mockConsole('info');
        defaultLog('info', 'info message');
        expect(consoleMock).toHaveBeenCalledWith('info message');
    });

    test('wrongType', () => {
        mockConsole('log');
        // @ts-expect-error TS2354
        defaultLog('wrongType', 'wrong type message');
        expect(consoleMock).toHaveBeenCalledWith('wrong type message');
    });
});
