module.exports = {
    resolveSnapshotPath: (testPath: string) => testPath.replace('test.ts', 'test.snap.ts'),
    resolveTestPath: () => 'example.test.js',
    testPathForConsistencyCheck: 'example.test.js',
};
