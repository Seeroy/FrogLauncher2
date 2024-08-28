let packs_downloadList = [];
let packs_promiseResolve;
let packs_promise;
let packs_currentDownloading = 0;

class FrogPacks {
    // Создать пак
    static createPack = (baseVersion, displayName) => {
        displayName = FrogUtils.translit(displayName);
        let modpackId = displayName.replace(/\W/g, '_');
        let modpackPath = path.join(GAME_DATA, "modpacks", modpackId);

        fs.mkdirSync(modpackPath, {recursive: true});
        fs.mkdirSync(path.join(modpackPath, "mods"), {recursive: true});
        let parsedVersion = FrogVersionsManager.parseVersionID(baseVersion);
        let resultJson = {
            id: modpackId,
            uuid: crypto.randomUUID(),
            displayName: displayName,
            baseVersion: {
                full: baseVersion,
                type: parsedVersion.type,
                number: parsedVersion.name
            },
            files: []
        };
        FrogPacks.writeModpackManifest(modpackId, resultJson);
        FrogVersionsUI.loadVersions();
        return true;
    }

    // Получить манифест пака
    static getModpackManifest = (modpackId) => {
        if (FrogPacks.isModpackExists(modpackId)) {
            return JSON.parse(fs.readFileSync(path.join(GAME_DATA, "modpacks", modpackId, "manifest.json")))
        }
        return false;
    }

    // Сохранить манифест пака
    static writeModpackManifest = (modpackId, manifestData) => {
        let modpackPath = path.join(GAME_DATA, "modpacks", modpackId);
        if (!fs.existsSync(modpackPath)) {
            fs.mkdirSync(modpackPath, {recursive: true});
        }
        return fs.writeFileSync(path.join(modpackPath, "manifest.json"), JSON.stringify(manifestData, null, 4));
    }

    // Существует ли такой пак
    static isModpackExists = (modpackId) => {
        if (typeof modpackId !== "string") return false;
        return fs.existsSync(path.join(GAME_DATA, "modpacks", modpackId, "manifest.json"));
    }

    // Удалить файл из модпака
    static deleteFileFromModpack = (filePath, fromModpack = false, modpackId = null) => {
        if (fromModpack === true && !FrogPacks.isModpackExists(modpackId)) {
            return false;
        }

        // Удаляем файл
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Если это модпак - удаляем из конфига. Если нет - возвращаем true
        if (fromModpack === false) {
            // Перезагружаем список
            FrogPacksUI.loadInstalledList();
            return true;
        }

        // Получаем манифест нужного пака
        let modpackData = FrogPacks.getModpackManifest(modpackId);
        let modpackFiles = modpackData.files;
        let deletionIndex = -1;
        // Ищем deletion index
        modpackFiles.forEach((item, i) => {
            if (item.name === path.basename(filePath)) {
                deletionIndex = i;
            }
        })
        // Удаляем из конфига, если нашли
        if (deletionIndex !== -1) {
            modpackFiles.splice(deletionIndex, 1);
            modpackData.files = modpackFiles;
            FrogPacks.writeModpackManifest(modpackId, modpackData);
        }
        // Перезагружаем список
        FrogPacksUI.loadInstalledList();
        return true;
    }

    // Получить список модов из пака
    static getPackModlist = (modpackId) => {
        if (!FrogPacks.isModpackExists(modpackId)) {
            return false;
        }
        return FrogPacks.getModpackManifest(modpackId).files;
    }

    // Проверить и установить недостающие моды
    static verifyAndInstall = (modpackId) => {
        return packs_promise = new Promise((resolve) => {
            packs_promiseResolve = resolve;
            FrogPacks.verifyFiles(modpackId).then(() => {
                if (packs_downloadList.length === 0) {
                    return resolve(true);
                }
                packs_currentDownloading = -1;
                FrogPacks.downloadNext();
            })
        });
    }

    // Скачать следующий мод из списка
    static downloadNext = () => {
        packs_currentDownloading++;
        if (typeof packs_downloadList[packs_currentDownloading] === "undefined") {
            return packs_promiseResolve(true);
        }
        let filePath = packs_downloadList[packs_currentDownloading].path;
        let url = packs_downloadList[packs_currentDownloading].url;
        let displayName = packs_downloadList[packs_currentDownloading].displayName;
        fs.mkdirSync(path.dirname(filePath), {recursive: true});
        FrogDownloader.downloadFile(url, filePath, displayName).then(() => {
            FrogPacks.downloadNext();
        })
    }

    // Проверить моды и составить список для скачивания
    static verifyFiles = (modpackId) => {
        packs_downloadList = [];
        return new Promise(resolve => {
            let filesList = FrogPacks.getPackModlist(modpackId);
            if (filesList === false || filesList.length === 0) {
                return resolve(true, "emptyList");
            }

            filesList.forEach((item) => {
                let filePath = path.join(GAME_DATA, "modpacks", modpackId, item.path);
                if (!fs.existsSync(filePath) || !FrogAssets.verifyFile(filePath, item.hashes.sha1)) {
                    packs_downloadList.push({
                        path: filePath,
                        url: item.url,
                        displayName: item.displayName
                    })
                }
            });
            return resolve(true);
        })
    }

    // Получить список паков
    static getPacksList = () => {
        let packsPath = path.join(GAME_DATA, "modpacks");
        if (!fs.existsSync(packsPath)) {
            return [];
        }

        let rdPacks = fs.readdirSync(packsPath);
        if (rdPacks.length === 0) {
            return [];
        }

        let validItems = [];
        rdPacks.forEach((item) => {
            if (FrogPacks.isModpackExists(item)) {
                validItems.push(item);
            }
        })
        return validItems;
    }

    // Очистить ID модпака от лишних символов
    static modpackCleanID = (id) => {
        return id.toString().replace(/\W/g, '_').trim();
    }

    // Импортировать пак с Modrinth (.mrpack)
    static importModrinthPack = async (archivePath, iconUrl = false) => {
        FrogToasts.create(MESSAGES.packs.importing, "publish", path.parse(archivePath).name, 2500);

        // Создаём нужные директории
        let modpacksPath = path.join(GAME_DATA, "modpacks");
        let decompPath = path.join(modpacksPath, "TMP");
        fs.mkdirSync(path.join(decompPath), {recursive: true});

        // Распаковываем архив
        await FrogUtils.unpackArchive(archivePath, decompPath);

        // Читаем индекс и генерируем переменные
        let modrinthIndex = JSON.parse(fs.readFileSync(path.join(decompPath, "modrinth.index.json")));
        let modpackId = `${modrinthIndex.name} ${modrinthIndex.versionId}`.replace(/\W/g, '_').trim();
        if (FrogPacks.isModpackExists(modpackId)) {
            FrogToasts.create(MESSAGES.packs.importFailed, "error", MESSAGES.packs.alreadyExists);
            await fs.rmdir(decompPath, {recursive: true});
            return false;
        }
        if (fs.existsSync(path.join(decompPath, "overrides"))) {
            await fsExtra.move(path.join(decompPath, "overrides"), path.join(modpacksPath, modpackId));
        } else {
            fs.mkdirSync(path.join(modpacksPath, modpackId));
        }

        // Получаем тип и версию игры
        let baseVersionType = "vanilla";
        if (Object.keys(modrinthIndex.dependencies).includes("fabric-loader") || Object.keys(modrinthIndex.dependencies).includes("fabric-api")) {
            baseVersionType = "fabric";
        }
        if (Object.keys(modrinthIndex.dependencies).includes("forge")) {
            baseVersionType = "forge";
        }
        if (Object.keys(modrinthIndex.dependencies).includes("neoforge")) {
            baseVersionType = "neoforge";
        }
        if (Object.keys(modrinthIndex.dependencies).includes("quilt") || Object.keys(modrinthIndex.dependencies).includes("quilt-loader")) {
            baseVersionType = "quilt";
        }

        // Готовим список файлов
        let preparedFilesList = [];
        modrinthIndex.files.forEach(item => {
            if (typeof item?.env?.client === "undefined" || item?.env?.client === "required") {
                preparedFilesList.push({
                    hashes: item.hashes,
                    path: item.path,
                    name: path.basename(item.path),
                    url: item.downloads[0],
                    size: item.fileSize,
                    displayName: path.parse(item.path).name
                })
            }
        })

        // Создаём и сохраняем свой манифест
        let manifestJson = {
            id: modpackId,
            uuid: crypto.randomUUID(),
            displayName: `${modrinthIndex.name} ${modrinthIndex.versionId}`,
            baseVersion: {
                full: `${baseVersionType}-${modrinthIndex.dependencies.minecraft}`,
                type: baseVersionType,
                number: modrinthIndex.dependencies.minecraft
            },
            files: preparedFilesList,
            icon: iconUrl
        };
        FrogPacks.writeModpackManifest(modpackId, manifestJson);
        await fsExtra.move(path.join(decompPath, "modrinth.index.json"), path.join(modpacksPath, modpackId, "modrinth.index.json"));
        FrogToasts.create(MESSAGES.packs.imported, "check", `${modrinthIndex.name} ${modrinthIndex.versionId}`);
        await fs.rmdir(decompPath, {recursive: true});
        return true;
    }

    // Установить зависимости для мода
    static installDependenciesList = (deps, gameVersion, downloadPath) => {
        var currentDepInstalling = -1;

        return new Promise(resolve => {
            let depsResolve = resolve;

            function installNextDep() {
                currentDepInstalling++;
                if (typeof deps[currentDepInstalling] === "undefined") {
                    return depsResolve(true);
                }

                FrogRequests.get(`https://api.modrinth.com/v2/project/${deps[currentDepInstalling].project_id}/version?game_versions=["${gameVersion}"]`).then(result => {
                    let [isSuccess, depVersions] = result;
                    if(!isSuccess){
                        return installNextDep();
                    }
                    // Получаем манифест версии
                    FrogRequests.get(`https://api.modrinth.com/v2/version/${depVersions[0].id}`).then(secondResult => {
                        let [isSuccess, response] = secondResult;
                        if(!isSuccess){
                            return installNextDep();
                        }
                        // Если не модпак - просто скачиваем файл
                        let fileItem = response.files[0];
                        let fullDownloadPath = path.join(downloadPath, fileItem.filename);
                        FrogFlyout.setProgress(0);
                        FrogFlyout.setText(MESSAGES.commons.downloaing, response.name);
                        FrogDownloader.downloadFile(fileItem.url, fullDownloadPath, fileItem.filename).then(() => {
                            return installNextDep();
                        });
                    })
                })
            }

            installNextDep();
        })
    }

    // Скачать ресурс по ID версии
    static downloadByVersionID = (versionId, buttonElement = false, installPath = "") => {
        let iconUrl = false;
        if (buttonElement !== false) {
            iconUrl = $(buttonElement).parent().parent().parent().parent().find("img.icon").attr("src");
        }
        return new Promise(resolve => {
            let modpackId = packman__currentModpack.id;
            let downloadPath = path.join(GAME_DATA, packs_currentMode);
            let directoryDlPath;
            if (FrogPacks.isModpackExists(modpackId)) {
                downloadPath = path.join(GAME_DATA, "modpacks", modpackId, packs_currentMode);
                directoryDlPath = downloadPath;
            }
            // Получаем манифест версии
            FrogRequests.get(`https://api.modrinth.com/v2/version/${versionId}`).then(result => {
                let [isSuccess, response] = result;
                if(!isSuccess){
                    FrogFlyout.changeMode("idle");
                    FrogPacksUI.reloadAll(false, true, true);
                    return resolve();
                }

                // Если не модпак - просто скачиваем файл
                let fileItem = response.files[0];
                if (installPath !== "") {
                    downloadPath = installPath;
                }
                downloadPath = path.join(downloadPath, fileItem.filename);
                FrogFlyout.setProgress(0);
                FrogFlyout.setText(MESSAGES.commons.downloaing, response.name);
                FrogFlyout.changeMode("progress").then(() => {
                    FrogDownloader.downloadFile(fileItem.url, downloadPath, fileItem.filename).then(() => {
                        if (packs_currentMode !== "modpacks") {
                            if (typeof response.dependencies !== "undefined" && response.dependencies.length > 0 && FrogConfig.read("autoInstallDeps") === true) {
                                return FrogPacks.installDependenciesList(response.dependencies, response.game_versions[0], directoryDlPath).then(() => {
                                    FrogFlyout.changeMode("idle");
                                    FrogPacksUI.reloadAll(false, true, true);
                                    return resolve();
                                });
                            }

                            // Возвращем стандартный режим
                            FrogFlyout.changeMode("idle");
                            FrogPacksUI.reloadAll(false, true, true);
                            return resolve();
                        } else {
                            // Ставим модпак
                            FrogFlyout.setText(MESSAGES.commons.installing);
                            FrogFlyout.changeMode("spinner").then(() => {
                                FrogPacks.importModrinthPack(downloadPath, iconUrl).then(() => {
                                    fs.unlinkSync(downloadPath);
                                    // Возвращем стандартный режим
                                    FrogFlyout.changeMode("idle").then(() => {
                                        FrogVersionsUI.loadVersions();
                                        FrogPacksUI.reloadAll();
                                        return resolve();
                                    });
                                });
                            });
                        }
                    });
                })
            })
        })
    }

    // Импортировать пак с Modrinth (.mrpack) через диалог выбора
    static importModrinthPackDialog = async () => {
        let result = await ipcRenderer.invoke("open-dialog", {
            properties: ["dontAddToRecent"],
            filters: [{name: ".mrpack", extensions: ["mrpack"]}],
        });
        if (result === false) {
            return false;
        }
        return await FrogPacks.importModrinthPack(result[0]);
    }

    // Экспортировать пак в zip-файл
    static exportModpack = async (modpackId) => {
        let result = await ipcRenderer.invoke("save-dialog", {
            properties: ["dontAddToRecent"],
            filters: [{name: ".zip", extensions: ["zip"]}],
        });
        if (result === false) {
            return false;
        }
        let modpackPath = path.join(GAME_DATA, "modpacks", modpackId);
        FrogToasts.create(MESSAGES.packManager.exportStarted, "upgrade", path.basename(result));
        await FrogUtils.compressDirectory(result, modpackPath);
        FrogToasts.create(MESSAGES.packManager.exportCompleted, "upgrade", path.basename(result));
        return true;
    }

    // Импортировать пак из файла
    static importModpack = async () => {
        let result = await ipcRenderer.invoke("open-dialog", {
            properties: ["dontAddToRecent"],
            filters: [{name: ".zip", extensions: ["zip"]}],
        });
        if (result === false) {
            return false;
        }
        let unpackPath = path.join(GAME_DATA, "modpacks");
        FrogToasts.create(MESSAGES.packManager.importStarted, "download", path.basename(result[0]));
        await FrogUtils.unpackArchive(result[0], unpackPath);
        FrogToasts.create(MESSAGES.packManager.importCompleted, "download", path.basename(result[0]));
        await FrogPacksUI.reloadAll(true, true, true);
        return true;
    }

    // Сменить иконку пака
    static changePackIcon = async (modpackId) => {
        if (!FrogPacks.isModpackExists(modpackId)) {
            return resolve(false);
        }

        let result = await ipcRenderer.invoke("open-dialog", {
            properties: ["dontAddToRecent"],
            filters: [{name: ".png", extensions: ["png"]}],
        });

        if (result === false) {
            return false;
        }

        let modpackData = FrogPacks.getModpackManifest(modpackId);
        modpackData.icon = "pack";
        FrogPacks.writeModpackManifest(modpackId, modpackData);

        let iconPath = path.join(GAME_DATA, "modpacks", modpackId, "icon.png");

        await fs.copyFile(result[0], iconPath);
        FrogPackManagerUI.loadModpackIcon(modpackData);
        FrogPacksUI.refreshDirectorySelect();
        return true;
    }
}