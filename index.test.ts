import * as libExports from './index.js';

test('Should not export anything unnecessary', () => {
    expect(libExports).toEqual({
        createToolkitCli: expect.any(Function),
    });
});
