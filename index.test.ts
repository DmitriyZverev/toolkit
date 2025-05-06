import * as libExports from './index.js';

test('Should not export anything unnecessary', () => {
    expect(libExports).toEqual({
        startCli: expect.any(Function),
        defaultLog: expect.any(Function),
    });
});
