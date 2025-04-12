#!/usr/bin/env node
import {runCli} from '../index.js';

runCli({
    argv: process.argv.slice(2),
    cwd: process.cwd(),
});
