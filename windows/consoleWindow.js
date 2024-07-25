let path = require("path");
const {BrowserWindow} = require("electron");

const CON_OPTIONS = {
    width: 800,
    height: 600,
    minWidth: 640,
    minHeight: 480,
    maxWidth: 1920,
    maxHeight: 1080,
    show: false,
    icon: path.join(__dirname, "../web/assets/icon.ico"),
    resizable: true,
    maximizable: true,
    autoHideMenuBar: true,
    transparent: true,
    title: "Консоль",
    frame: false,
    webPreferences: {
        preload: path.join(__dirname, "../web/preload.js"),
        nodeIntegration: true,
        contextIsolation: false,
    },
};
const CON_URL = "web/console.html";

exports.create = (cb) => {
    let winObj = new BrowserWindow(CON_OPTIONS);

    winObj.loadFile(CON_URL);

    winObj.once("ready-to-show", () => {
        winObj.show();
        cb(winObj);
    });
};
