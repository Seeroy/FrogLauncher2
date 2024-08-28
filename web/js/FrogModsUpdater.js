let mods__packList = [];
let mods__currentChecking = 0;
let mods__promise;
let mods__promiseResolve;
let mods__resultList = [];
let mods__currentModpackId;

class FrogModsUpdater {
    // Проверить доступные обновления модов в паках
    static checkPackUpdatesAvailable = (modpackId) => {
        mods__currentModpackId = modpackId;
        mods__resultList = [];
        mods__packList = [];
        mods__currentChecking = 0;

        $("#modal-packManager .updateTab .selectMode").hide();
        $("#modal-packManager .updateTab .updateMode").show();
        mods__promise = new Promise(resolve => {
            let modpackManifest = FrogPacks.getModpackManifest(mods__currentModpackId);
            if (modpackManifest === false) {
                return resolve(false);
            }

            mods__packList = Object.fromEntries(
                Object.entries(modpackManifest.files).filter(([key, value]) => value.path.split("/")[0] === "mods"));
            mods__promiseResolve = resolve;
            FrogModsUpdater.checkNextModUpdates(modpackManifest.baseVersion.number, modpackManifest.baseVersion.type);
        })
        return mods__promise;
    }

    // Проверить следующий мод из списка
    static checkNextModUpdates(mcVersion, mcLoader) {
        mods__currentChecking++;
        if (typeof mods__packList[mods__currentChecking] === "undefined") {
            return mods__promiseResolve(mods__resultList);
        }

        let fullPath = path.join(GAME_DATA, "modpacks", mods__currentModpackId, mods__packList[mods__currentChecking].path);
        if (!fs.existsSync(fullPath)) {
            return FrogModsUpdater.checkNextModUpdates(mcVersion, mcLoader);
        }

        $("#modal-packManager .updateTab .updateMode .text").text(`${MESSAGES.packs.updatePackM.checking} (${mods__currentChecking}/${Object.values(mods__packList).length})`);
        FrogAssetsParsers.readModInfo(fullPath).then(resultLocal => {
            if (resultLocal === false || mods__packList[mods__currentChecking].url.match(/https:\/\/cdn\.modrinth\.com\//mig) === null) {
                return FrogModsUpdater.checkNextModUpdates(mcVersion, mcLoader);
            }
            $("#modal-packManager .updateTab .updateMode .mod").text(resultLocal.name);
            let projectId = mods__packList[mods__currentChecking].url.split("/")[4];
            let currentVersion = resultLocal.version;
            let latestVersion = false;
            FrogRequests.get(`https://api.modrinth.com/v2/project/${projectId}/version?game_versions=[%22${mcVersion}%22]&loaders=[%22${mcLoader}%22]`).then(result => {
                let [isSuccess, response] = result;
                if(!isSuccess){
                    return FrogModsUpdater.checkNextModUpdates(mcVersion, mcLoader);
                }

                response.forEach((item) => {
                    if (item.version_type === "release" && latestVersion === false) {
                        latestVersion = {
                            version: item.version_number,
                            file: item.files[0],
                            name: item.name
                        };
                    }
                })
                if (currentVersion !== latestVersion.version && currentVersion !== false && latestVersion !== false) {
                    mods__resultList.push({
                        projectId: projectId,
                        mcVersion: mcVersion,
                        projectName: resultLocal.name,
                        current: currentVersion,
                        currentFileName: mods__packList[mods__currentChecking].name,
                        latest: latestVersion,
                        icon: resultLocal.icon
                    })
                }
                setTimeout(() => {
                    FrogModsUpdater.checkNextModUpdates(mcVersion, mcLoader);
                }, 650);
            })
        });
    }

    // Обновить все моды из списка обновлений
    static updateAllFromList = async () => {
        $("#modal-packManager .updateTab .foundUpdateMode").hide();
        $("#modal-packManager .updateTab .foundUpdateMode .updatesList").html("");
        $("#modal-packManager .updateTab .updateMode .mod").text("");
        $("#modal-packManager .updateTab .updateMode .text").text(MESSAGES.packs.updatePackM.installing);
        $("#modal-packManager .updateTab .updateMode").show();

        let modpackManifest = FrogPacks.getModpackManifest(mods__currentModpackId);
        if (modpackManifest === false) {
            return false;
        }
        modpackManifest.files.forEach((filesItem, manifestIndex) => {
            // Ищем нужный файл в списке
            let filename = filesItem.name;
            let modItemIndex = -1;
            // Ищем ID мода в списке
            mods__resultList.forEach((modItem, index) => {
                if (modItem.currentFileName === filename) {
                    modItemIndex = index;
                }
            })
            if (modItemIndex !== -1) {
                // Удаляем старый мод и обновляем конфиг
                let fullModPath = path.join(GAME_DATA, "modpacks", mods__currentModpackId, modpackManifest.files[manifestIndex].path);
                if (fs.existsSync(fullModPath)) {
                    fs.unlinkSync(fullModPath);
                }
                modpackManifest.files[manifestIndex].hashes = mods__resultList[modItemIndex].latest.file.hashes;
                modpackManifest.files[manifestIndex].url = mods__resultList[modItemIndex].latest.file.url;
                modpackManifest.files[manifestIndex].name = mods__resultList[modItemIndex].latest.file.filename;
                modpackManifest.files[manifestIndex].size = mods__resultList[modItemIndex].latest.file.size;
                modpackManifest.files[manifestIndex].path = "mods/" + mods__resultList[modItemIndex].latest.file.filename;
                modpackManifest.files[manifestIndex].displayName = path.parse(mods__resultList[modItemIndex].latest.file.filename).base;
            }
        });
        // Записываем изменения
        FrogPacks.writeModpackManifest(mods__currentModpackId, modpackManifest);
        // Запускаем проверку модов
        await FrogPacks.verifyAndInstall(mods__currentModpackId);
        $("#modal-packManager .updateTab .updateMode").hide();
        $("#modal-packManager .updateTab .selectMode").show();
        await FrogFlyout.changeMode("idle");
        FrogFlyout.setUIStartMode(false);
        return true;
    }

    // Начать проверку обновлений
    static checkUpdates = async () => {
        let updatesList = await FrogModsUpdater.checkPackUpdatesAvailable(packman__currentModpack.id);
        $("#modal-packManager .updateTab .foundUpdateMode .updatesList").html("");
        $("#modal-packManager .updateTab .foundUpdateMode").show();
        $("#modal-packManager .updateTab .updateMode").hide();
        updatesList.forEach((item) => {
            $("#modal-packManager .updateTab .updates-list").append(`<div class='item custom-select icon-and-description'>
                    <img class="icon" src="data:image/png;base64,${item.icon}" />
                    <span class="title">${item.projectName}</span>
                    <div class="flex flex-align-center flex-gap-4 description"><span>${item.current}</span> <span class="material-symbols-outlined">arrow_forward</span> <span>${item.latest.version}</span></div>
                    </div>`);
        });
    }
}