import { exec, spawn } from "child_process";
import { shell } from "electron";
import { promisify } from "util";

const execPromise = promisify(exec);

async function checkCommandExists(command: string): Promise<boolean> {
  try {
    await execPromise(`${command} --version`);
    return true;
  } catch {
    return false;
  }
}

async function checkYtdlp(): Promise<boolean> {
  const exists = await checkCommandExists("yt-dlp");
  if (exists) {
    console.log("yt-dlp is already installed");
  } else {
    console.log("yt-dlp is not installed");
  }
  return exists;
}

async function checkPythonAndPip(): Promise<{
  python: string;
  pip: string;
} | null> {
  let pythonCmds =
    process.platform === "win32"
      ? ["py", "python", "python3"]
      : ["python3", "python"];
  let python = "";
  for (const cmd of pythonCmds) {
    if (await checkCommandExists(cmd)) {
      python = cmd;
      break;
    }
  }

  if (!python) {
    console.error(
      "Python is not installed or not in PATH. Please install Python from https://www.python.org/downloads/"
    );
    // Open the download page
    shell.openExternal("https://www.python.org/downloads/");
    return null;
  }

  try {
    await execPromise(`${python} -m pip --version`);
  } catch {
    console.log("pip is not installed, trying to install...");
    try {
      await execPromise(`${python} -m ensurepip --upgrade`);
      console.log("pip installed successfully");
    } catch (e) {
      console.error("Error installing pip: install it manually", e);
      return null;
    }
  }

  return { python, pip: `${python} -m pip` };
}

function spawnTerminalCommand(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let terminalProcess;

    if (process.platform === "win32") {
      // Use PowerShell as admin
      terminalProcess = spawn(
        "powershell",
        [
          "-Command",
          `Start-Process powershell -Verb RunAs -ArgumentList '${command}'`,
        ],
        { stdio: "inherit", shell: true }
      );
    } else if (process.platform === "darwin") {
      // macOS Terminal con AppleScript
      terminalProcess = spawn(
        "osascript",
        [
          "-e",
          `tell application "Terminal" to do script "${command}"`,
          "-e",
          'tell application "Terminal" to activate',
        ],
        { stdio: "inherit" }
      );
    } else if (process.platform === "linux") {
      // Linux: open x-terminal-emulator and run the command
      terminalProcess = spawn("x-terminal-emulator", ["-e", command], {
        stdio: "inherit",
      });
    } else {
      reject(new Error("Platform not supported"));
      return;
    }

    terminalProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Error in terminal with code ${code}`));
      }
    });
  });
}

async function installYtdlp() {
  const deps = await checkPythonAndPip();
  if (!deps) {
    throw new Error("Missing necessary dependencies to install yt-dlp.");
  }

  const installCommand = `${deps.pip} install --upgrade yt-dlp`;

  try {
    await spawnTerminalCommand(installCommand);
    console.log("yt-dlp installed successfully");
  } catch (err) {
    console.error("Error installing yt-dlp:", err);
    throw err;
  }
}

export const checkDependencies = async () => {
  const installed = await checkYtdlp();
  if (!installed) {
    try {
      await installYtdlp();
    } catch (e) {
      console.error("yt-dlp installation failed:", e);
    }
  }
};
