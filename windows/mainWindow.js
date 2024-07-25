let path = require("path");
const {BrowserWindow} = require("electron");
const ejs = require('ejs-electron');

const MW_OPTIONS = {
    width: 1400,
    height: 900,
    minWidth: 1150,
    minHeight: 750,
    show: false,
    icon: path.join(__dirname, "../web/assets/icon.png"),
    resizable: true,
    maximizable: true,
    autoHideMenuBar: true,
    frame: false,
    transparent: true,
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
    },
};

exports.create = (cb) => {
    let winObj = new BrowserWindow(MW_OPTIONS);

    ejs.listen();
    winObj.loadURL("file://" + __dirname + "/../web/index.ejs");

    winObj.once("ready-to-show", () => {
        winObj.show();
        cb(winObj);
    });
};
