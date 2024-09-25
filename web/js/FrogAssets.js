const MC_ASSETS_URL = "https://resources.download.minecraft.net";
let assetsPromiseResolve;
let assetsPromise;
global.assetsDownloadStatus = {
    total: 0,
    current: 0,
    percent: 0
}
let needToDownload = [];
let currentDownloadingAsset = 0;

class FrogAssets {
    // Проверить и скачать недостающие ассеты
    static verifyAndDownload = (version) => {
        return assetsPromise = new Promise((resolve) => {
            assetsPromiseResolve = resolve;
            FrogAssets.verifyAssets(version, true).then(result => {
                needToDownload = result;
                if (needToDownload.length === 0) {
                    return resolve(true);
                }
                currentDownloadingAsset = -1;
                this.downloadNextAsset();
            })
        });
    }

    static downloadNextAsset = () => {
        currentDownloadingAsset++;
        if (typeof needToDownload[currentDownloadingAsset] === "undefined") {
            return assetsPromiseResolve(true);
        }
        global.assetsDownloadStatus.current = currentDownloadingAsset;
        global.assetsDownloadStatus.percent = Math.round((global.assetsDownloadStatus.current / global.assetsDownloadStatus.total) * 100);
        let filePath = needToDownload[currentDownloadingAsset].path;
        let url = needToDownload[currentDownloadingAsset].url;
        let displayName = path.basename(filePath);
        FrogDownloader.downloadFile(url, filePath, displayName).then(() => {
            FrogAssets.downloadNextAsset();
        })
    }

    // Получить полный список файлов, которые нужно скачивать для запуска игры
    static verifyAssets = async (version, changeUI = true) => {
        if (changeUI) {
            FrogFlyout.setUIStartMode(true);
            FrogFlyout.setText("Проверка ассетов");
            await FrogFlyout.changeMode("spinner");
        }
        let downloadsList = [];
        let assetsPath = path.resolve(path.join(GAME_DATA, "assets"));
        let librariesPath = path.resolve(path.join(GAME_DATA, "libraries"));
        let vPkg = await FrogVersionsManager.getVersionManifest(version);
        // Создаём все папки, если их нет
        if (!fs.existsSync(assetsPath)) {
            fs.mkdirSync(assetsPath, {recursive: true});
        }
        if (!fs.existsSync(librariesPath)) {
            fs.mkdirSync(librariesPath, {recursive: true});
        }
        let currentOs = os.platform().replace("win32", "windows");
        // Библиотеки
        vPkg.libraries.forEach((library) => {
            if (!library.downloads || !library.downloads.classifiers) return;
            //if (FrogAssets.parseLibraryRule(library)) return;

            let libraryArtifact = this.getOS() === 'osx'
                ? library.downloads.classifiers['natives-osx'] || library.downloads.classifiers['natives-macos']
                : library.downloads.classifiers[`natives-${this.getOS()}`];

            let arch = os.arch() === "x64" ? "64" : "32";
            if (typeof libraryArtifact === "undefined" && typeof library.downloads.classifiers[`natives-${this.getOS()}-${arch}`] !== "undefined") {
                libraryArtifact = library.downloads.classifiers[`natives-${this.getOS()}-${arch}`]
            }

            let libraryPath = path.resolve(path.join(librariesPath, libraryArtifact.path));
            let libraryRule, libraryRuleAction;
            if (typeof library.rules !== "undefined" && library.rules.length > 1) {
                library.rules.forEach((rule) => {
                    if (typeof rule.os !== "undefined") {
                        libraryRule = rule;
                        libraryRuleAction = rule.action;
                    }
                })
            }
            if ((typeof library.rules === "undefined") || (typeof library.rules !== "undefined" && libraryRuleAction === "allow" && libraryRule.os.name === currentOs) || (typeof library.rules !== "undefined" && libraryRuleAction === "deny" && libraryRule.os.name !== currentOs)) {
                if (!FrogAssets.verifyFile(libraryPath, libraryArtifact.sha1)) {
                    downloadsList.push({
                        url: libraryArtifact.url,
                        path: libraryPath
                    })
                }
            }
        });
        // Ассеты
        let vAssets = await FrogRequests.get(vPkg.assetIndex.url);
        Object.values(vAssets.objects).forEach((asset) => {
            let hash = asset.hash;
            let subHash = hash.substring(0, 2);
            let assetPath = path.resolve(path.join(assetsPath, "objects", subHash, hash));
            if (!FrogAssets.verifyFile(assetPath, hash)) {
                downloadsList.push({
                    url: MC_ASSETS_URL + "/" + hash + subHash,
                    path: assetPath
                })
            }
        });
        return downloadsList;
    }

    // Проверить файл по хешу SHA-1
    static verifyFile(fullPath, sha1) {
        if (fs.existsSync(fullPath)) {
            let sha1sum = crypto
                .createHash("sha1")
                .update(fs.readFileSync(fullPath))
                .digest("hex");
            if (sha1sum === sha1) {
                return true;
            }
        }
        return false;
    }

    static parseLibraryRule(lib) {
        if (lib.rules) {
            if (lib.rules.length > 1) {
                if (lib.rules[0].action === 'allow' && lib.rules[1].action === 'disallow' && lib.rules[1].os.name === 'osx') {
                    return this.getOS() === 'osx'
                }
                return true
            } else {
                if (lib.rules[0].action === 'allow' && lib.rules[0].os) return lib.rules[0].os.name !== this.getOS()
            }
        } else {
            return false
        }
    }

    static getOS = () => {
        switch (process.platform) {
            case 'win32':
                return 'windows';
            case 'darwin':
                return 'osx';
            default:
                return 'linux';
        }
    }

    // Скачать/перенести нужный файл OptiFine
    static setupOptiFine = async (ofVersion, gamePath) => {
        let ofUrl = manifestData?.optifine[ofVersion];
        if(!ofUrl){
            FrogCollector.writeLog(`OF: No OptiFine in manifestData`);
            return false;
        }
        // Готовим все переменные
        let ofFile = FrogUtils.getFilenameFromURL(ofUrl);
        let ofCachePath = path.join(GAME_DATA, "cache", "of", ofFile);
        let ofCacheDirname = path.dirname(ofCachePath);
        let ofPath = path.join(gamePath, "mods", ofFile);
        let ofPathDirname = path.dirname(ofPath);

        // Создаём папку если её нет
        if(!fs.existsSync(ofPathDirname)){
            fs.mkdirSync(ofPathDirname, {recursive: true});
        }

        if(fs.existsSync(ofCachePath) && fs.existsSync(ofPath)){
            // Если файл уже есть в кэше и в игре
            FrogCollector.writeLog(`OF: File already in cache`);
            return true;
        } else if(fs.existsSync(ofCachePath) && !fs.existsSync(ofPath)){
            // Есть в кэше, но нет в игре - копируем в моды
            FrogCollector.writeLog(`OF: File already in cache, but not copied to mods`);
            fs.copyFileSync(ofCachePath, ofPath);
            FrogCollector.writeLog(`OF: Copying to mods done`);
            return true;
        }

        // Если нет папки под кэш
        if(!fs.existsSync(path.dirname(ofCacheDirname))){
            FrogCollector.writeLog(`OF: No cache directory, creating one`);
            fs.mkdirSync(ofCacheDirname, {recursive: true});
        }

        // Скачиваем файл
        FrogCollector.writeLog(`OF: Starting file download [url=${ofUrl}]`);
        let dlResult = await FrogDownloader.downloadFile(ofUrl, ofCachePath, `OptiFine ${ofVersion}`, true);
        if(!dlResult){
            FrogCollector.writeLog(`OF: Failed to download file`);
            return false;
        }

        // Копируем в моды
        fs.copyFileSync(ofCachePath, ofPath);
        FrogCollector.writeLog(`OF: Copying to mods done`);
        return true;
    }

    // Удалить OptiFine (после завершения игры)
    static removeOptiFine = (ofVersion, gamePath) => {
        let ofUrl = manifestData?.optifine[ofVersion];
        if(!ofUrl){
            return false;
        }
        // Готовим все переменные
        let ofFile = FrogUtils.getFilenameFromURL(ofUrl);
        let ofPath = path.join(gamePath, "mods", ofFile);

        if(fs.existsSync(ofPath)){
            FrogCollector.writeLog(`OF: OptiFine found in mods, removing...`);
            fs.unlinkSync(ofPath);
        }
        return true;
    }
}