let packs_downloadList = [];
let packs_promiseResolve;
let packs_promise;
let packs_currentDownloading = 0;

class FrogPacks {
    // Создать пак
    static createPack = (baseVersion, displayName) => {
        let modpackId = displayName.replace(/\W/g, '_');
        let modpackPath = path.join(global.GAME_DATA, "modpacks", modpackId);

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
            return JSON.parse(fs.readFileSync(path.join(global.GAME_DATA, "modpacks", modpackId, "manifest.json")))
        }
        return false;
    }

    // Сохранить манифест пака
    static writeModpackManifest = (modpackId, manifestData) => {
        let modpackPath = path.join(global.GAME_DATA, "modpacks", modpackId);
        if (!fs.existsSync(modpackPath)) {
            fs.mkdirSync(modpackPath, {recursive: true});
        }
        return fs.writeFileSync(path.join(modpackPath, "manifest.json"), JSON.stringify(manifestData, null, 4));
    }

    // Существует ли такой пак
    static isModpackExists = (modpackId) => {
        return fs.existsSync(path.join(global.GAME_DATA, "modpacks", modpackId, "manifest.json"));
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
        FrogDownloader.downloadFile(url, filePath, displayName, true).then(() => {
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
                let filePath = path.join(global.GAME_DATA, "modpacks", modpackId, item.path);
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
        let packsPath = path.join(global.GAME_DATA, "modpacks");
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
    static importModrinthPack = (archivePath, iconUrl = false) => {
        return new Promise(resolve => {
            FrogToasts.create(MESSAGES.packs.importing, "publish", path.parse(archivePath).name, 2500);
            // Распаковываем архив
            let modpacksPath = path.join(global.GAME_DATA, "modpacks");
            let decompPath = path.join(modpacksPath, "TMP");
            fs.mkdirSync(path.join(decompPath), {recursive: true});
            let archiveFile = new AdmZip(archivePath);
            archiveFile.extractAllTo(decompPath, true);

            // Читаем индекс и генерируем переменные
            let modrinthIndex = JSON.parse(fs.readFileSync(path.join(decompPath, "modrinth.index.json")));
            let modpackId = `${modrinthIndex.name} ${modrinthIndex.versionId}`.replace(/\W/g, '_').trim();
            if (FrogPacks.isModpackExists(modpackId)) {
                FrogToasts.create(MESSAGES.packs.importFailed, "error", MESSAGES.packs.alreadyExists);
                fs.rmdirSync(decompPath, {recursive: true});
                return resolve(false, "exists");
            }
            fsExtra.moveSync(path.join(decompPath, "overrides"), path.join(modpacksPath, modpackId));

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
            fsExtra.moveSync(path.join(decompPath, "modrinth.index.json"), path.join(modpacksPath, modpackId, "modrinth.index.json"));
            FrogToasts.create(MESSAGES.packs.imported, "check", `${modrinthIndex.name} ${modrinthIndex.versionId}`);
            fs.rmdirSync(decompPath, {recursive: true});
            FrogVersionsUI.loadVersions();
            return resolve(true);
        })
    }

    // Скачать ресурс по ID версии
    static downloadByVersionID = (versionId, buttonElement = false) => {
        let iconUrl = false;
        if (buttonElement !== false) {
            iconUrl = $(buttonElement).parent().parent().parent().parent().find("img.icon").attr("src")
        }
        return new Promise(resolve => {
            let modpackId = $("#modal-packs select").val();
            let downloadPath = path.join(global.GAME_DATA, packs_currentMode);
            if (FrogPacks.isModpackExists(modpackId)) {
                downloadPath = path.join(global.GAME_DATA, "modpacks", modpackId, packs_currentMode);
            }
            // Получаем манифест версии
            $.get(`https://api.modrinth.com/v2/version/${versionId}`, (response) => {
                // Если не модпак - просто скачиваем файл
                let fileItem = response.files[0];
                downloadPath = path.join(downloadPath, fileItem.filename);
                FrogFlyout.setProgress(0);
                FrogFlyout.setText(MESSAGES.commons.downloaing, response.name);
                FrogFlyout.changeMode("progress").then(() => {
                    FrogDownloader.downloadFile(fileItem.url, downloadPath, fileItem.filename, true).then(() => {
                        if (packs_currentMode !== "modpacks") {
                            // Возвращем стандартный режим
                            FrogFlyout.changeMode("idle");
                            FrogPacksUI.reloadAll();
                            return resolve();
                        } else {
                            // Ставим модпак
                            FrogFlyout.setText(MESSAGES.commons.installing);
                            FrogFlyout.changeMode("spinner").then(() => {
                                FrogPacks.importModrinthPack(downloadPath, iconUrl).then(() => {
                                    fs.unlinkSync(downloadPath);
                                    // Возвращем стандартный режим
                                    FrogVersionsUI.loadVersions().then(() => {
                                        FrogFlyout.changeMode("idle");
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
    static importModrinthPackDialog = () => {
        return new Promise(resolve => {
            ipcRenderer.send("load-modrinth-pack-dialog");
            ipcRenderer.once("get-modrinth-pack-result", (event, archivePath) => {
                FrogPacks.importModrinthPack(archivePath).then(resolve);
            })
        })
    }

    // Экспортировать пак в файл (DEPRECATED/UNUSED)
    static exportModpack = (modpackId) => {
        // DEPRECATED
        return false;

        return new Promise(resolve => {
            let mpManifest = FrogPacks.getModpackManifest(modpackId);
            if (mpManifest === false) {
                return resolve(false);
            }

            ipcRenderer.send("save-modpack-dialog", `${modpackId}.frogpack`);
            ipcRenderer.once("get-modpack-save-result", (event, result) => {
                fs.writeFileSync(result, JSON.stringify(mpManifest));
                FrogToasts.create("Экспорт модпака завершён!", "save", "Нажмите здесь для открытия папки", 7000, "", () => {
                    openExternal(path.dirname(result));
                });
                return resolve(true);
            })
        })
    }

    // Импортировать пак из файла (DEPRECATED/UNUSED)
    static importModpack = () => {
        // DEPRECATED
        return false;

        return new Promise(resolve => {
            ipcRenderer.send("load-modpack-dialog");
            ipcRenderer.once("get-modpack-load-result", (event, result) => {
                FrogToasts.create("Идёт импорт модпака", "publish", path.parse(result).name);
                let manifestData = JSON.parse(fs.readFileSync(result));
                if (typeof manifestData !== "undefined" && typeof manifestData.id !== "undefined" && typeof manifestData.baseVersion !== "undefined") {
                    let modpackId = manifestData.id;
                    if (FrogPacks.isModpackExists(modpackId)) {
                        FrogToasts.create("Импорт модпака неудачен", "error", "Такой пак уже установлен!");
                        return resolve(false, "exists");
                    }
                    let modpackPath = path.join(global.GAME_DATA, "modpacks", modpackId);
                    fs.mkdirSync(modpackPath, {recursive: true});
                    fs.mkdirSync(path.join(modpackPath, "mods"), {recursive: true});
                    FrogPacks.writeModpackManifest(modpackId, manifestData);
                    FrogToasts.create("Импорт модпака завершён!", "check", manifestData.displayName);
                    FrogVersionsUI.loadVersions();
                    return resolve(true);
                }
                FrogToasts.create("Импорт модпака неудачен", "error", "Файл повреждён");
                return resolve(false, "invalid");
            })
        })
    }
}