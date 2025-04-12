#!/usr/bin/env node
import {runCli, defaultLog} from '../index.js';

runCli({commands: {}}).catch((err) => defaultLog('error', String(err)));
