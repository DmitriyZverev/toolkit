import * as libExports from './';

test('Should not export anything unnecessary', () => {
    expect(libExports).toEqual({});
});
