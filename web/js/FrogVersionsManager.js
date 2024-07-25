let fullListPerformance1, fullListPerformance2;

class FrogVersionsManager {
    // Получить все ванильные доступные версии
    static getVanillaVersionsAvailable = (alllowedType = ["release"]) => {
        const allowedVersionTypes = ["release", "snapshot"];
        alllowedType = alllowedType || ["release"];

        // Проверяем переменную allowedType
        if (!Array.isArray(alllowedType)) {
            return false;
        }
        if (!allowedVersionTypes.some(v => alllowedType.includes(v))) {
            return false;
        }

        // Делаем вещи
        return new Promise((resolve, reject) => {
            let result = [];
            vanilla.getVersionManifest().then((manifest) => {
                manifest.versions.forEach((versionItem) => {
                    if (alllowedType.includes(versionItem.type)) {
                        result.push(versionItem.id);
                    }
                });
                resolve(result);
            }, reject);
        });
    }

    // Получить все доступные версии Fabric
    static getFabricVersionsAvailable = () => {
        return new Promise((resolve, reject) => {
            let result = [];
            fabric.listSupportedVersions().then((manifest) => {
                manifest.forEach((versionItem) => {
                    if (versionItem.stable === true) {
                        result.push(versionItem.version);
                    }
                });
                resolve(result);
            }, reject);
        });
    }

    // Получить все доступные версии Quilt
    static getQuiltVersionsAvailable = () => {
        return new Promise((resolve, reject) => {
            let result = [];
            quilt.listSupportedVersions().then((manifest) => {
                manifest.forEach((versionItem) => {
                    if (versionItem.stable === true) {
                        result.push(versionItem.version);
                    }
                });
                resolve(result);
            }, reject);
        });
    }

    // Получить все доступные версии Forge
    static getForgeVersionsAvailable = () => {
        return new Promise((resolve, reject) => {
            let result = [];
            forge.listSupportedVersions().then((manifest) => {
                manifest.forEach((versionItem) => {
                    if (versionItem.stable === true) {
                        result.push(versionItem.version);
                    }
                });
                resolve(result);
            }, reject);
        });
    }

    // Получить все доступные версии NeoForge
    static getNeoForgeVersionsAvailable = () => {
        return new Promise((resolve, reject) => {
            let result = [];
            neoforge.listSupportedVersions().then((manifest) => {
                manifest.forEach((versionItem) => {
                    if (versionItem.stable === true) {
                        result.push(versionItem.version);
                    }
                });
                resolve(result);
            }, reject);
        });
    }

    // Получить все доступные версии игры всех загрузчиков
    static getAllVersionsAvailable = (vanillaVersionsType = 0) => {
        // R = result
        let vanillaR, fabricR, forgeR, neoforgeR, quiltR;
        return new Promise((resolve) => {
            FrogVersionsManager.getVanillaVersionsAvailable(vanillaVersionsType).then(vanilla => {
                vanillaR = vanilla;
                return FrogVersionsManager.getFabricVersionsAvailable();
            }).then(fabric => {
                fabricR = fabric;
                return FrogVersionsManager.getForgeVersionsAvailable();
            }).then(forge => {
                forgeR = forge;
                return FrogVersionsManager.getNeoForgeVersionsAvailable();
            }).then(neoforge => {
                neoforgeR = neoforge;
                return FrogVersionsManager.getQuiltVersionsAvailable()
            }).then(quilt => {
                quiltR = quilt;
                resolve({
                    vanilla: vanillaR,
                    fabric: fabricR,
                    forge: forgeR,
                    neoforge: neoforgeR,
                    quilt: quiltR
                })
            })
        });
    }

    // Получить список установленных версий
    static getInstalledVersionsList = () => {
        let verDataPath = path.join(global.GAME_DATA, "versions")
        if (!fs.existsSync(verDataPath)) {
            return [];
        }
        return fs.readdirSync(verDataPath);
    }

    // Получить полностью подготовленный для UI список версий
    static getPreparedVersions = (vanillaVersionsType = 0) => {
        fullListPerformance1 = performance.now();
        FrogCollector.writeLog(`VersionManager: Preparing full versions list`);
        let resultList = [];
        let installedVersions = FrogVersionsManager.getInstalledVersionsList();

        let modpacksList = FrogPacks.getPacksList();
        if (modpacksList.length > 0) {
            modpacksList.forEach((pack) => {
                let packData = FrogPacks.getModpackManifest(pack);
                resultList.push({
                    id: "pack-" + packData.id,
                    version: packData.baseVersion,
                    type: "pack",
                    displayName: packData.displayName,
                    installed: true
                })
            })
        }

        return new Promise((resolve, reject) => {
            FrogVersionsManager.getAllVersionsAvailable(vanillaVersionsType).then(result => {
                // Обработка каждого из видов
                result.vanilla.forEach((item) => {
                    // Добавляем ванильную версию
                    let vanillaId = `vanilla-${item}`;
                    resultList.push({
                        id: vanillaId,
                        version: item,
                        type: "vanilla",
                        displayName: FrogVersionsManager.versionToDisplayName(vanillaId),
                        installed: installedVersions.includes(item)
                    })

                    // Ищем все остальные совпадающие версии и добавляем в список
                    Object.keys(result).forEach(key => {
                        if (result[key].includes(item) && key !== "vanilla") {
                            let verId = `${key}-${item}`;
                            resultList.push({
                                id: verId,
                                version: item,
                                type: key,
                                displayName: FrogVersionsManager.versionToDisplayName(verId),
                                installed: installedVersions.includes(verId)
                            })
                        }
                    });
                })
                fullListPerformance2 = performance.now();
                FrogCollector.writeLog(`VersionManager: Full list ready in ${fullListPerformance2 - fullListPerformance1} ms`);
                // Возвращаем готовый список
                resolve(resultList);
            });
        });
    };

    // Перевести ID версии в её название
    static versionToDisplayName = (version) => {
        // Например: forge-1.16.5
        let type = version.split("-")[0];
        let ver = version.split("-")[1];

        let displayType;
        switch (type) {
            case "forge":
                displayType = "Forge";
                break;
            case "neoforge":
                displayType = "NeoForge";
                break;
            case "fabric":
                displayType = "Fabric";
                break;
            case "quilt":
                displayType = "Quilt";
                break;
            case "pack":
                let packData = FrogPacks.getModpackManifest(ver);
                return `Сборка ${packData.displayName}`;
            default:
                displayType = "Версия";
                break;
        }

        return `${displayType} ${ver}`;
    }

    // Получить активную версию
    static getActiveVersion = () => {
        return FrogConfig.read("activeVersion", "none");
    }

    // Задать активную версию
    static setActiveVersion = (version) => {
        if (version.split("-").length !== 2) {
            return false;
        }
        FrogConfig.write("activeVersion", version);
        FrogVersionsUI.reloadButtonUI();
        return true;
    }

    // Получить манифест локальной версии (для 3rdparty)
    static getLocalVersionManifest = (versionName) => {
        let manifestPath = path.join(global.GAME_DATA, "versions", versionName, `${versionName}.json`);
        if (!fs.existsSync(manifestPath)) {
            return false;
        }
        return JSON.parse(fs.readFileSync(manifestPath));
    }

    // Получить манифест по версии
    static getVersionManifest = (version) => {
        let isSuccess = false;
        let verUrl = false;
        return new Promise(resolve => {
            vanilla.getVersionManifest().then(manifest => {
                manifest.versions.forEach((item) => {
                    if (item.id === version) {
                        isSuccess = true;
                        verUrl = item.url
                    }
                });
                if (isSuccess === true && verUrl !== false) {
                    $.get(verUrl, (pkgData) => {
                        if (pkgData !== false) {
                            resolve(pkgData);
                        } else {
                            resolve(false);
                        }
                    });
                } else {
                    resolve(false);
                }
            })
        });
    }
}