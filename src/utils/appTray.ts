import { ServerConfigManager } from "@/managers/ServerConfigManager";
import { app, Menu, shell, Tray } from "electron";
import path from "path";

let tray: Tray | null = null;
export function createTray() {
  const iconPath = path.join(
    __dirname,
    "..",
    "assets",
    "icons",
    process.platform === "win32" ? "icon.ico" : "icon.png"
  );

  tray = new Tray(iconPath);

  // Obtener estado actual del inicio automático
  const loginSettings = app.getLoginItemSettings();
  let startAtLoginChecked = loginSettings.openAtLogin;

  // Context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Seerial...",
      click: () => {
        shell.openExternal(
          `http://localhost:${ServerConfigManager.serverConfig.httpPort}/`
        );
      },
    },
    { type: "separator" },
    {
      label: "Start Seerial Media Server at Login",
      type: "checkbox",
      checked: startAtLoginChecked,
      click: (menuItem) => {
        const enabled = menuItem.checked;
        app.setLoginItemSettings({
          openAtLogin: enabled,
          path: process.execPath,
          args: [], // start args if necessary
        });
        startAtLoginChecked = enabled;
      },
    },
    { type: "separator" },
    {
      label: "About Seerial",
      click: () => {
        shell.openExternal(`https://seerial.es`);
      },
    },
    { type: "separator" },
    {
      label: "Exit",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Seerial App");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    // Do nothing
  });

  tray.on("double-click", () => {
    shell.openExternal(
      `http://localhost:${ServerConfigManager.serverConfig.httpPort}/`
    );
  });
}
