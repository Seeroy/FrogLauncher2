window.$ = window.jQuery = require("jquery");
const fs = require("fs");
const fsPromises = require("fs/promises");
const fsExtra = require("fs-extra");
const path = require("path");
const os = require("os");
const {ipcRenderer} = require("electron");
const crypto = require("crypto");
const openExternal = require("open");
const request = require("request");
const {Client, Authenticator} = require("minecraft-launcher-core");
const {Auth} = require("msmc");
const {forge, neoforge, fabric, quilt, vanilla, liner} = require("tomate-loaders");
const machineUuid = require("machine-uuid");
const packageJson = require("./../package.json");
const Jimp = require("jimp");
const compressing = require('compressing');
const treeKill = require("tree-kill");
const NBT = require('mcnbt');
const {exec} = require('node:child_process');
let toml = require('toml');
const {GameDig} = require('gamedig');

// Версия лаунчера
global.LAUNCHER_VERSION = packageJson.version;

// Ссылки на сайт
global.SITE_URL = "https://froglauncher.ru";
global.CDN_URL = "https://cdn.froglauncher.ru";
global.SKINS_API_URL = "https://skins.froglauncher.ru";
global.STATS_URL = "https://statscol.seeeroy.ru/save_fl?savedata=";
//global.NEWS_URL = CDN_URL + "/news.json"; // Перемещено в index.ejs
global.SERVERS_URL = CDN_URL + `/servers.json?_=${Date.now()}`;
global.AUTHLIB_INJECTOR_URL = CDN_URL + "/authlib-injector.jar";
global.REPO_NAME = "Seeroy/FrogLauncher2";

// Ссылка на Java
global.JAVA_LIST_URL = "https://api.adoptium.net/v3/info/available_releases";

// Последние логи лаунчера
global.LAST_LOG = "";

// Лаунчер в dev mode? test mode?
global.IS_APP_IN_DEV = ipcRenderer.sendSync("isAppInDev");
global.IS_APP_IN_TEST = ipcRenderer.sendSync("isAppInTest");

if (IS_APP_IN_DEV) {
    //global.SKINS_API_URL = "http://localhost:58883";
}

// Пути к файлам
global.USERDATA_PATH = path.normalize(ipcRenderer.sendSync("get-userdata-path"));
global.CONFIG_PATH = path.join(global.USERDATA_PATH, "config.json");
if (process.platform === "win32") {
    global.DOT_MC_PATH = path.join(os.homedir(), "AppData", "Roaming", ".minecraft");
} else {
    global.DOT_MC_PATH = path.join(os.homedir(), ".minecraft");
}

const animateCSS = (element, animation, fast = true, prefix = "animate__") => {
    const animationName = `${prefix}${animation}`;
    const node = document.querySelector(element);

    return animateCSSNode(node);
};

const animateCSSNode = (node, animation, fast = true, prefix = "animate__") => {
    return new Promise((resolve, reject) => {
        const animationName = `${prefix}${animation}`;

        if (fast === true) {
            node.classList.add(`${prefix}animated`, animationName, `${prefix}faster`);
        } else {
            node.classList.add(`${prefix}animated`, animationName);
        }

        function handleAnimationEnd(event) {
            event.stopPropagation();
            node.classList.remove(
                `${prefix}animated`,
                animationName,
                `${prefix}faster`
            );
            resolve("Animation ended");
        }

        node.addEventListener("animationend", handleAnimationEnd, {once: true});
    });
}