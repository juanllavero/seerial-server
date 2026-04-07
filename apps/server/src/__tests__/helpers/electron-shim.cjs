// CJS stub for electron — prevents real Electron bootstrap in Jest tests
const app = {
  getPath: () => require('os').tmpdir(),
  on: () => {},
  whenReady: () => Promise.resolve(),
};
module.exports = { app, ipcMain: { handle: () => {}, on: () => {} }, BrowserWindow: class {} };
