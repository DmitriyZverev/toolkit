import * as libExports from './index.js';

test('Should not export anything unnecessary', () => {
    expect(libExports).toEqual({
        runCli: expect.any(Function),
        defaultLog: expect.any(Function),
    });
});
