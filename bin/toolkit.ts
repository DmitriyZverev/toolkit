#!/usr/bin/env node
import {startCli, defaultLog} from '../index.js';

startCli().catch((err) => defaultLog('error', String(err)));
