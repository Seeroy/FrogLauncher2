let isAppInDev = process.env.LAUNCHER_IN_DEV !== undefined;
let isAppInTest = process.env.LAUNCHER_IN_TEST !== undefined;

if (isAppInDev && !process.argv.includes("noreload")) {
    require('electron-reloader')(module);
}

// Загрузка модулей
let startTime = performance.now();
const {app, ipcMain, BrowserWindow, globalShortcut, dialog} = require("electron");
const {autoUpdater} = require("electron-updater");
const os = require("os");
const colors = require("colors");
const {Auth} = require("msmc");
const pjson = require("./package.json");
require('console-stamp')(console);
const userDataPath = app.getPath("userData");

const {forge, neoforge, fabric, quilt, vanilla, liner} = require("tomate-loaders");

let lastLogBack;

// Создаём глобальные переменные для хранения BrowserWindow
let mainWindowObject;
let mainWindow = require("./windows/mainWindow"); // Модуль для создания главного окна
let consoleWindowObject;
let consoleWindow = require("./windows/consoleWindow"); // Модуль для создания окна консоли
const DEFAULT_USER_AGENT = "FrogLauncher/v" + pjson.version;

// Е-Е-Едем
console.log(colors.inverse("Frog Launcher | Version: " + pjson.version + " | Hostname: " + os.hostname() + " | <> by Seeroy"));

app.whenReady().then(() => {
    if (!isAppInDev) {
        console.log("We are in production mode");
        globalShortcut.register('Control+Shift+I', () => {
            return false;
        });
    } else {
        console.log("ooo|   Hello, developer   |ooo");
    }

    // Создаём консоль
    consoleWindow.create(function (conObj) {
        consoleWindowObject = conObj;
        consoleWindowObject.hide();
        consoleWindowObject.webContents.userAgent = DEFAULT_USER_AGENT;
        consoleWindowObject.on("close", (e) => {
            e.preventDefault();
            consoleWindowObject.hide();
        })
        console.log(colors.green("Console window created"));
    });

    // Создаём главное окно
    mainWindow.create(function (winObj) {
        mainWindowObject = winObj;
        mainWindowObject.webContents.userAgent = DEFAULT_USER_AGENT;
        autoUpdater.checkForUpdates().then();
        console.log(colors.green("Main window created"));
    });

    // Найдено обновление -> отправляем ipc
    autoUpdater.on("update-available", () => {
        console.log("Found an update, downloading...");
        mainWindowObject.webContents.send("update-available");
    });
    // Файл обновления скачан -> отправляем ipc
    autoUpdater.on("update-downloaded", () => {
        console.log("Update download completed, waiting for restart");
        mainWindowObject.webContents.send("update-downloaded");
    });

    // Console log в консоль
    ipcMain.on("console-log", (e, data) => {
        lastLogBack += "\n" + data;
        if (
            typeof consoleWindowObject !== "undefined" &&
            consoleWindowObject != null
        ) {
            consoleWindowObject.webContents.send("user-console-log", lastLogBack.slice(-8000).replace("\n", "<br>"));
        }
    });

    // Вернуть полный console log
    ipcMain.on("full-console-log", (e) => {
        if (
            typeof consoleWindowObject !== "undefined" &&
            consoleWindowObject != null
        ) {
            consoleWindowObject.webContents.send("user-console-log", lastLogBack.slice(-8000).replace("\n", "<br>"));
        }
    });

    // Начать установку обновления
    ipcMain.on("install-update", () => {
        console.log("Installing update...");
        autoUpdater.quitAndInstall();
    });

    // Получить userdataPath
    ipcMain.on("get-userdata-path", (e) => {
        e.returnValue = userDataPath;
    });

    // Получить isInDev
    ipcMain.on("isAppInDev", (e) => {
        e.returnValue = isAppInDev;
    });

    // Получить isInTest
    ipcMain.on("isAppInTest", (e) => {
        e.returnValue = isAppInTest;
    });

    // Запуск лаунчера завершён
    ipcMain.on("launcher-ready", (e) => {
        let endTime = performance.now();
        console.log("Launcher started in", colors.yellow(((endTime - startTime) / 1000).toFixed(3) + "s"));
    });

    // Работа с окном консоли
    ipcMain.on("close-console-window", () => {
        consoleWindowObject.hide();
    });
    ipcMain.on("open-console-window", () => {
        if (!consoleWindowObject.isVisible()) {
            consoleWindowObject.show();
        } else {
            consoleWindowObject.focus();
        }
    });
    ipcMain.on("hide-console-window", () => {
        consoleWindowObject.minimize();
    });

    // Закрыть окно консоли
    ipcMain.on("close-console-window", () => {
        consoleWindowObject.hide();
    });

    // Закрыть окно лаунчера
    ipcMain.on("close-main-window", () => {
        console.log(colors.blue("Bye Bye"));
        mainWindowObject.close();
        mainWindowObject = null;
        app.exit(0);
    });

    // Свернуть окно лаунчера
    ipcMain.on("hide-main-window", () => {
        mainWindowObject.minimize();
    });

    // Развернуть на весь экран окно лаунчера
    ipcMain.on("maximize-main-window", () => {
        if(mainWindowObject.isMaximized()){
            mainWindowObject.unmaximize();
        } else {
            mainWindowObject.maximize();
        }
    });

    // Полностью скрыть окно лаунчера
    ipcMain.on("disappear-main-window", () => {
        mainWindowObject.hide();
    });

    // Показать окно лаунчера
    ipcMain.on("appear-main-window", () => {
        mainWindowObject.show();
        mainWindowObject.focus();
    });

    // Фикс для сраного Электрона?
    ipcMain.on("focus-fix", () => {
        mainWindowObject.blur();
        mainWindowObject.focus();
    });

    // Выбрать папку для игры
    ipcMain.on("open-gd-dialog", (event) => {
        let dialogRet = dialog.showOpenDialogSync({
            properties: ["openDirectory", "dontAddToRecent"],
            buttonLabel: "Выбрать",
            title: "Выберите папку для хранения файлов игры",
        });
        if (dialogRet !== undefined) {
            event.sender.send("get-gd-result", dialogRet[0]);
        } else {
            event.sender.send("get-gd-result", false);
        }
    });

    // Выбрать Java
    ipcMain.on("open-java-dialog", (event) => {
        let dialogRet = dialog.showOpenDialogSync({
            properties: ["dontAddToRecent"],
            buttonLabel: "Выбрать",
            title: "Выберите файл java.exe",
            filters: [{name: "java.exe", extensions: ["exe"]}],
        });
        if (dialogRet !== undefined) {
            event.sender.send("get-java-result", dialogRet[0]);
        } else {
            event.sender.send("get-java-result", false);
        }
    });

    // Сохранение пака
    ipcMain.on("save-modpack-dialog", (event, data) => {
        let dialogRet = dialog.showSaveDialogSync({
            properties: ["dontAddToRecent"],
            defaultPath: data,
            filters: [{name: "FrogPack", extensions: ["frogpack"]}],
        });
        if (dialogRet !== undefined) {
            event.sender.send("get-modpack-save-result", dialogRet);
        } else {
            event.sender.send("get-modpack-save-result", false);
        }
    });

    // Загрузка пака
    ipcMain.on("load-modpack-dialog", (event) => {
        let dialogRet = dialog.showOpenDialogSync({
            properties: ["dontAddToRecent"],
            filters: [{name: "FrogPack", extensions: ["frogpack"]}],
        });
        if (dialogRet !== undefined) {
            event.sender.send("get-modpack-load-result", dialogRet[0]);
        } else {
            event.sender.send("get-modpack-load-result", false);
        }
    });

    // Загрузка пака .mrpack
    ipcMain.on("load-modrinth-pack-dialog", (event) => {
        let dialogRet = dialog.showOpenDialogSync({
            properties: ["dontAddToRecent"],
            filters: [{name: ".mrpack", extensions: ["mrpack"]}],
        });
        if (dialogRet !== undefined) {
            event.sender.send("get-modrinth-pack-result", dialogRet[0]);
        } else {
            event.sender.send("get-modrinth-pack-result", false);
        }
    });

    // Авторизация через Microsoft
    ipcMain.on("use-ms-auth", (event) => {
        let authManager = new Auth("select_account");
        authManager.launch("electron").then((xboxManager) => {
            xboxManager.getMinecraft().then((result2) => {
                event.sender.send("get-ms-auth-result", {
                    profile: result2.profile,
                    mclc: result2.mclc()
                });
            })
        });
    });

    // Получить конфиг для MCLC
    ipcMain.on("generate-mclc-config", (event, data) => {
        let type = data.type;
        let version = data.version;
        let gameData = data.gameData;

        switch (type) {
            case "vanilla":
                return event.sender.send("get-mclc-config", {
                    version: {
                        type: "release",
                        number: version,
                    },
                    root: gameData
                });
            case "forge":
                return forge.getMCLCLaunchConfig({
                    gameVersion: version,
                    rootPath: gameData
                }).then((result) => {
                    event.sender.send("get-mclc-config", result);
                });
            case "neoforge":
                return neoforge.getMCLCLaunchConfig({
                    gameVersion: version,
                    rootPath: gameData
                }).then((result) => {
                    event.sender.send("get-mclc-config", result);
                });
            case "fabric":
                return fabric.getMCLCLaunchConfig({
                    gameVersion: version,
                    rootPath: gameData
                }).then((result) => {
                    event.sender.send("get-mclc-config", result);
                });
            case "quilt":
                return quilt.getMCLCLaunchConfig({
                    gameVersion: version,
                    rootPath: gameData
                }).then((result) => {
                    event.sender.send("get-mclc-config", result);
                });
        }
    })
});