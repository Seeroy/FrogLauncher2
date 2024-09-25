let fullListPerformance1, fullListPerformance2;
let manifestData = false;

class FrogVersionsManager {
    // Получить все ванильные доступные версии
    static getVanillaVersionsAvailable = async (alllowedType = ["release"]) => {
        const allowedVersionTypes = ["release", "snapshot", "old_beta", "old_alpha"];
        alllowedType = alllowedType || ["release"];

        // Проверяем переменную allowedType
        if (!Array.isArray(alllowedType)) {
            return false;
        }
        if (!allowedVersionTypes.some(v => alllowedType.includes(v))) {
            return false;
        }

        // Делаем вещи
        let result = [];
        let manifest = await vanilla.getVersionManifest();
        manifest.versions.forEach((versionItem) => {
            if (alllowedType.includes(versionItem.type)) {
                result.push(versionItem.id);
            }
        });
        return result;
    }

    // Получить все доступные версии Fabric
    static getFabricVersionsAvailable = async () => {
        let result = [];
        let manifest = await fabric.listSupportedVersions();
        manifest.forEach((versionItem) => {
            if (versionItem.stable === true) {
                result.push(versionItem.version);
            }
        });
        return result;
    }

    // Получить все доступные версии Quilt
    static getQuiltVersionsAvailable = async () => {
        let result = [];
        let manifest = await quilt.listSupportedVersions();
        manifest.forEach((versionItem) => {
            if (versionItem.stable === true) {
                result.push(versionItem.version);
            }
        });
        return result;
    }

    // Получить все доступные версии Forge
    static getForgeVersionsAvailable = async () => {
        let result = [];
        let manifest = await forge.listSupportedVersions();
        manifest.forEach((versionItem) => {
            if (versionItem.stable === true) {
                result.push(versionItem.version);
            }
        });
        return result;
    }

    // Получить все доступные версии NeoForge
    static getNeoForgeVersionsAvailable = async () => {
        let result = [];
        let manifest = await neoforge.listSupportedVersions();
        manifest.forEach((versionItem) => {
            if (versionItem.stable === true) {
                result.push(versionItem.version);
            }
        });
        return result;
    }

    // Получить все доступные версии ForgeOptiFine
    static getOptiFineVersionsAvailable = async () => {
        let result = [];
        if(!manifestData){
            let [isSuccess, reqData] = await FrogRequests.get(CDN_URL + "/assets/data.json");
            if(!isSuccess){
                return result;
            }
            manifestData = reqData;
        }
        for (const [key, value] of Object.entries(manifestData.optifine)) {
            result.push(key);
        }
        return result;
    }

    // Получить все доступные версии игры всех загрузчиков
    static getAllVersionsAvailable = async (vanillaVersionsType = ["release"]) => {
        let vanillaVersions = await FrogVersionsManager.getVanillaVersionsAvailable(vanillaVersionsType);
        let fabricVersions = await FrogVersionsManager.getFabricVersionsAvailable();
        let forgeVersions = await FrogVersionsManager.getForgeVersionsAvailable();
        let neoforgeVersions = await FrogVersionsManager.getNeoForgeVersionsAvailable();
        let quiltVersions = await FrogVersionsManager.getQuiltVersionsAvailable()
        let forgeOptiFineVersions = await FrogVersionsManager.getOptiFineVersionsAvailable();

        return {
            vanilla: vanillaVersions,
            fabric: fabricVersions,
            forge: forgeVersions,
            neoforge: neoforgeVersions,
            quilt: quiltVersions,
            forgeOptiFine: forgeOptiFineVersions
        }
    }

    // Получить список установленных версий
    static getInstalledVersionsList = () => {
        let verDataPath = path.join(GAME_DATA, "versions")
        if (!fs.existsSync(verDataPath)) {
            return [];
        }
        return fs.readdirSync(verDataPath);
    }

    // Получить избранные версии
    static getFavoriteVersions = () => {
        return FrogConfig.read("favoriteVersions", []);
    }

    // Добавить/удалить версию из избранного
    static addOrRemoveFavorite = (versionId) => {
        let favorites = FrogVersionsManager.getFavoriteVersions();
        if (favorites.includes(versionId)) {
            favorites.splice(favorites.indexOf(versionId), 1);
        } else {
            favorites.push(versionId);
        }
        return FrogConfig.write("favoriteVersions", favorites);
    }

    // Получить полностью подготовленный для UI список версий
    static getPreparedVersions = async () => {
        fullListPerformance1 = performance.now();
        FrogCollector.writeLog(`VersionManager: Preparing full versions list`);
        let resultList = [];
        let installedVersions = FrogVersionsManager.getInstalledVersionsList();

        let vanillaVersionsType = FrogVersionsUI.getVersionsTypeSelected();

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

        let result = await FrogVersionsManager.getAllVersionsAvailable(vanillaVersionsType);
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
        return resultList;
    };

    // Перевести ID версии в её название
    static versionToDisplayName = (version = null) => {
        if (version === null) {
            version = FrogVersionsManager.getActiveVersion();
        }

        // Например: forge-1.16.5
        let parsed = FrogVersionsManager.parseVersionID(version);

        let displayType;
        switch (parsed.type) {
            case "forge":
                displayType = "Forge";
                break;
            case "forgeOptiFine":
                displayType = "ForgeOptiFine";
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
                let packData = FrogPacks.getModpackManifest(parsed.name);
                return `${MESSAGES.versions.pack} ${packData.displayName}`;
            default:
                displayType = MESSAGES.commons.version;
                break;
        }

        return `${displayType} ${parsed.name}`;
    }

    // Получить активную версию
    static getActiveVersion = () => {
        return FrogConfig.read("activeVersion", "none");
    }

    // Задать активную версию
    static setActiveVersion = (version) => {
        if (version.split("-").length < 2) {
            return false;
        }
        FrogConfig.write("activeVersion", version);
        FrogVersionsUI.reloadButtonUI();
        return true;
    }

    // Получить манифест локальной версии (для 3rdparty)
    static getLocalVersionManifest = (versionName) => {
        let manifestPath = path.join(GAME_DATA, "versions", versionName, `${versionName}.json`);
        if (!fs.existsSync(manifestPath)) {
            return false;
        }
        return JSON.parse(fs.readFileSync(manifestPath));
    }

    // Получить манифест по версии
    static getVersionManifest = async (version) => {
        let isSuccess = false;
        let verUrl = false;

        let manifest = await vanilla.getVersionManifest();
        manifest.versions.forEach((item) => {
            if (item.id === version) {
                isSuccess = true;
                verUrl = item.url
            }
        });

        if (isSuccess === true && verUrl !== false) {
            let [isSuccess, pkgData] = await FrogRequests.get(verUrl);
            if (isSuccess && pkgData) {
                return pkgData;
            }
        }
        return false;
    }

    // Парсинг ID версии
    static parseVersionID = (versionId) => {
        let idSplit = versionId.split("-");
        let versionType = idSplit[0];
        idSplit.shift();
        return {
            type: versionType,
            name: idSplit.join("-"),
            id: versionId
        }
    }
}