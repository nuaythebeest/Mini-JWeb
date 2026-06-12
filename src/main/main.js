const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { Client } = require("ssh2");
const { connectAndInspect, getDeviceSnapshot, getActiveConfiguration, getMonitoringOutput, runDeviceAction, discardCandidateChanges, commitSetCommands, commitCheckSetCommands } = require("./netconf");

const uninstallRegistryKeys = [
  "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\759bddad-af52-5902-aebd-81d21502eb9c",
  "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\759bddad-af52-5902-aebd-81d21502eb9c",
  "HKLM\\Software\\759bddad-af52-5902-aebd-81d21502eb9c",
  "HKCU\\Software\\759bddad-af52-5902-aebd-81d21502eb9c"
];

function removeFileIfExists(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (_error) {
    // Best effort cleanup. Windows may already have removed the shortcut.
  }
}

function deleteRegistryKey(key, view) {
  spawnSync("reg.exe", ["delete", key, "/f", `/reg:${view}`], { windowsHide: true, stdio: "ignore" });
}

function runWindowsUninstall() {
  if (process.platform !== "win32") {
    return false;
  }

  const uninstallRequested = process.argv.some((arg) => arg === "--mini-jweb-uninstall");
  if (!uninstallRequested) {
    return false;
  }

  const installDir = path.dirname(process.execPath);
  const shortcutNames = [
    "Mini J-Web EX.lnk",
    "Mini J-Web EX Windows.lnk"
  ];
  const shortcutFolders = [
    path.join(process.env.ProgramData || "C:\\ProgramData", "Microsoft", "Windows", "Start Menu", "Programs"),
    path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), "Microsoft", "Windows", "Start Menu", "Programs"),
    path.join(process.env.PUBLIC || "C:\\Users\\Public", "Desktop"),
    path.join(os.homedir(), "Desktop")
  ];

  shortcutFolders.forEach((folder) => {
    shortcutNames.forEach((shortcutName) => removeFileIfExists(path.join(folder, shortcutName)));
  });
  uninstallRegistryKeys.forEach((key) => {
    deleteRegistryKey(key, "64");
    deleteRegistryKey(key, "32");
  });

  const cleanupCommand = [
    "ping 127.0.0.1 -n 3 > nul",
    `rmdir /s /q "${installDir}"`
  ].join(" & ");
  spawn("cmd.exe", ["/d", "/s", "/c", cleanupCommand], {
    detached: true,
    stdio: "ignore",
    windowsHide: true
  }).unref();

  app.quit();
  return true;
}

if (runWindowsUninstall()) {
  return;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1080,
    minHeight: 720,
    title: "Mini J-Web EX",
    backgroundColor: "#ffffff",
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.MINI_JWEB_DEV_SERVER) {
    win.loadURL(process.env.MINI_JWEB_DEV_SERVER);
  } else {
    win.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
}

function normalizeConnection(connection) {
  return {
    host: String(connection.host || "").trim(),
    port: Number(connection.port || 830),
    username: String(connection.username || "").trim(),
    password: String(connection.password || ""),
    readyTimeout: Number(connection.readyTimeout || 15000)
  };
}

function safeRemoteFirmwareName(filePath) {
  const fileName = path.basename(String(filePath || ""));
  if (!fileName || !/^[A-Za-z0-9_.+-]+$/.test(fileName) || fileName.includes("..")) {
    throw new Error("Firmware package file name contains unsupported characters.");
  }
  return fileName;
}

async function chooseFirmwareFile(win) {
  const result = await dialog.showOpenDialog(win, {
    title: "Select Junos firmware package",
    properties: ["openFile"],
    filters: [
      { name: "Junos packages", extensions: ["tgz", "tar", "gz"] },
      { name: "All files", extensions: ["*"] }
    ]
  });
  if (result.canceled || !result.filePaths.length) {
    return { canceled: true };
  }
  const filePath = result.filePaths[0];
  const stats = fs.statSync(filePath);
  const fileName = safeRemoteFirmwareName(filePath);
  return {
    canceled: false,
    path: filePath,
    name: fileName,
    size: stats.size,
    remotePath: `/var/tmp/${fileName}`
  };
}

function uploadFirmwarePackage(event, { connection, filePath, overwrite = false }) {
  const localPath = String(filePath || "");
  const fileName = safeRemoteFirmwareName(localPath);
  const remotePath = `/var/tmp/${fileName}`;
  const stats = fs.statSync(localPath);
  const conn = normalizeConnection(connection);

  return new Promise((resolve, reject) => {
    const client = new Client();
    let settled = false;
    const finish = (error, result) => {
      if (settled) {
        return;
      }
      settled = true;
      client.end();
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    };

    client.on("ready", () => {
      client.sftp((sftpError, sftp) => {
        if (sftpError) {
          finish(new Error(`SFTP is not ready: ${sftpError.message || sftpError}`));
          return;
        }
        const startUpload = () => {
          let transferred = 0;
          sftp.fastPut(localPath, remotePath, {
            step: (totalTransferred) => {
              transferred = totalTransferred;
              event.sender.send("firmware:uploadProgress", {
                fileName,
                remotePath,
                transferred,
                total: stats.size,
                percent: stats.size ? Math.min(100, Math.round((transferred / stats.size) * 100)) : 0
              });
            }
          }, (uploadError) => {
            if (sftp && typeof sftp.end === "function") {
              sftp.end();
            }
            if (uploadError) {
              finish(new Error(`Firmware upload failed: ${uploadError.message || uploadError}`));
              return;
            }
            event.sender.send("firmware:uploadProgress", {
              fileName,
              remotePath,
              transferred: stats.size,
              total: stats.size,
              percent: 100
            });
            finish(null, { ok: true, fileName, remotePath, size: stats.size, overwritten: Boolean(overwrite) });
          });
        };

        sftp.stat(remotePath, (statError) => {
          if (!statError && !overwrite) {
            if (sftp && typeof sftp.end === "function") {
              sftp.end();
            }
            finish(new Error(`Remote file already exists at ${remotePath}. Use overwrite or start upgrade with the existing file.`));
            return;
          }
          if (statError) {
            const code = statError.code || statError.errno;
            if (code !== 2 && !/no such file/i.test(statError.message || "")) {
              if (sftp && typeof sftp.end === "function") {
                sftp.end();
              }
              finish(new Error(`Remote file check failed: ${statError.message || statError}`));
              return;
            }
          }
          startUpload();
        });
      });
    });
    client.on("error", (error) => finish(new Error(`SSH/SFTP connection failed: ${error.message || error}`)));
    client.connect({
      host: conn.host,
      port: conn.port === 830 ? 22 : conn.port,
      username: conn.username,
      password: conn.password,
      readyTimeout: conn.readyTimeout
    });
  });
}

function checkRemoteFirmwarePackage({ connection, fileName }) {
  const safeName = safeRemoteFirmwareName(fileName);
  const remotePath = `/var/tmp/${safeName}`;
  const conn = normalizeConnection(connection);

  return new Promise((resolve, reject) => {
    const client = new Client();
    let settled = false;
    const finish = (error, result) => {
      if (settled) {
        return;
      }
      settled = true;
      client.end();
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    };

    client.on("ready", () => {
      client.sftp((sftpError, sftp) => {
        if (sftpError) {
          finish(new Error(`SFTP is not ready: ${sftpError.message || sftpError}`));
          return;
        }
        sftp.stat(remotePath, (statError, stats) => {
          if (sftp && typeof sftp.end === "function") {
            sftp.end();
          }
          if (statError) {
            const code = statError.code || statError.errno;
            if (code === 2 || /no such file/i.test(statError.message || "")) {
              finish(null, { ok: true, exists: false, fileName: safeName, remotePath });
              return;
            }
            finish(new Error(`Remote file check failed: ${statError.message || statError}`));
            return;
          }
          finish(null, {
            ok: true,
            exists: true,
            fileName: safeName,
            remotePath,
            size: stats?.size || 0,
            modifiedAt: stats?.mtime ? new Date(stats.mtime * 1000).toISOString() : ""
          });
        });
      });
    });
    client.on("error", (error) => finish(new Error(`SSH/SFTP connection failed: ${error.message || error}`)));
    client.connect({
      host: conn.host,
      port: conn.port === 830 ? 22 : conn.port,
      username: conn.username,
      password: conn.password,
      readyTimeout: conn.readyTimeout
    });
  });
}

app.whenReady().then(() => {
  ipcMain.handle("device:inspect", async (_event, connection) => connectAndInspect(connection));
  ipcMain.handle("device:snapshot", async (_event, connection) => getDeviceSnapshot(connection));
  ipcMain.handle("device:activeConfig", async (_event, connection) => getActiveConfiguration(connection));
  ipcMain.handle("device:monitor", async (_event, payload) => getMonitoringOutput(payload.connection, payload.view));
  ipcMain.handle("device:action", async (_event, payload) => runDeviceAction(payload.connection, payload.action));
  ipcMain.handle("device:revert", async (_event, connection) => discardCandidateChanges(connection));
  ipcMain.handle("device:commitCheck", async (_event, payload) => commitCheckSetCommands(payload));
  ipcMain.handle("device:commit", async (_event, payload) => commitSetCommands(payload));
  ipcMain.handle("firmware:chooseFile", async (event) => chooseFirmwareFile(BrowserWindow.fromWebContents(event.sender)));
  ipcMain.handle("firmware:checkRemoteFile", async (_event, payload) => checkRemoteFirmwarePackage(payload));
  ipcMain.handle("firmware:upload", async (event, payload) => uploadFirmwarePackage(event, payload));
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
