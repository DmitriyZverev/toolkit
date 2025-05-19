// Jest Snapshot v1, https://goo.gl/fbAQLP

exports[`0 1`] = `
{
  "compilationResult": {
    "diagnostics": [],
    "hasErrors": false,
  },
  "files": {
    "/index.js": "var foo = 1;
",
  },
}
`;

exports[`1 1`] = `
{
  "compilationResult": {
    "diagnostics": [
      {
        "category": 1,
        "code": 2322,
        "file": {
          "fileName": "/index.ts",
        },
        "length": 3,
        "messageText": "Type 'number' is not assignable to type 'string'.",
        "start": 6,
      },
    ],
    "hasErrors": true,
  },
  "files": {
    "/index.js": "var foo = 1;
",
  },
}
`;

exports[`Format diagnostics 1`] = `
[
  "index.ts(1,7): error TS2322: Type 'number' is not assignable to type 'string'.
",
  "index.ts(2,7): error TS2322: Type 'string' is not assignable to type 'number'.
",
]
`;
