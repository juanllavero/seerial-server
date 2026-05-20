// CJS stub for src/index.ts — prevents Electron bootstrap from running in Jest tests
const express = require('express');
const app = express();
exports.appServer = app;
exports.server = null;
