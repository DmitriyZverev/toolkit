#!/usr/bin/env node
import {createToolkitCli} from '../index.js';

const toolkit = createToolkitCli();

toolkit.start().catch((err) => toolkit.log('error', String(err)));
