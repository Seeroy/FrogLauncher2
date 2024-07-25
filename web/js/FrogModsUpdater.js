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

        $("#modal-packs .updateTab .selectMode").hide();
        $("#modal-packs .updateTab .updateMode").show();
        mods__promise = new Promise(resolve => {
            let modpackManifest = FrogPacks.getModpackManifest(modpackId);
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
        $("#modal-packs .updateTab .updateMode .text").text(`Проверка обновлений (${mods__currentChecking}/${Object.values(mods__packList).length})`);

        let projectId = mods__packList[mods__currentChecking].url.split("/")[4];
        let fileName = mods__packList[mods__currentChecking].name;

        let currentVersion = false;
        let latestVersion = false;
        $.get(`https://api.modrinth.com/v2/project/${projectId}/version?game_versions=[%22${mcVersion}%22]&loaders=[%22${mcLoader}%22]`, (result) => {
            result.forEach((item) => {
                if (item.files[0].filename === fileName) {
                    currentVersion = item.version_number;
                }
                if (item.version_type === "release" && latestVersion === false) {
                    latestVersion = {
                        version: item.version_number,
                        file: item.files[0],
                        name: item.name
                    };
                }
            })
            if (currentVersion !== latestVersion.version && currentVersion !== false && latestVersion !== false) {
                $.get(`https://api.modrinth.com/v2/project/${projectId}`, (projectData) => {
                    mods__resultList.push({
                        projectId: projectId,
                        mcVersion: mcVersion,
                        projectName: projectData.title,
                        current: currentVersion,
                        currentFileName: fileName,
                        latest: latestVersion
                    })
                    $("#modal-packs .updateTab .updateMode .mod").text(projectData.title);
                    setTimeout(() => {
                        FrogModsUpdater.checkNextModUpdates(mcVersion, mcLoader);
                    }, 1600);
                });
            } else {
                $("#modal-packs .updateTab .updateMode .mod").text("");
                setTimeout(() => {
                    FrogModsUpdater.checkNextModUpdates(mcVersion, mcLoader);
                }, 1600);
            }
        })
    }

    // Обновить все моды из списка обновлений
    static updateAllFromList = () => {
        $("#modal-packs .updateTab .foundUpdateMode").hide();
        $("#modal-packs .updateTab .foundUpdateMode .updatesList").html("");
        $("#modal-packs .updateTab .updateMode .mod").text("");
        $("#modal-packs .updateTab .updateMode .text").text("Установка обновлений");
        $("#modal-packs .updateTab .updateMode").show();
        return new Promise(resolve => {
            let modpackManifest = FrogPacks.getModpackManifest(mods__currentModpackId);
            if(modpackManifest === false){
                return false;
            }
            modpackManifest.files.forEach((filesItem, manifestIndex) => {
                // Ищем нужный файл в списке
                let filename = filesItem.name;
                let modItemIndex = -1;
                // Ищем ID мода в списке
                mods__resultList.forEach((modItem, index) => {
                    if(modItem.currentFileName === filename){
                        modItemIndex = index;
                    }
                })
                if(modItemIndex !== -1){
                    // Удаляем старый мод и обновляем конфиг
                    let fullModPath = path.join(global.GAME_DATA, "modpacks", mods__currentModpackId, modpackManifest.files[manifestIndex].path);
                    if(fs.existsSync(fullModPath)){
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
            FrogPacks.verifyAndInstall(mods__currentModpackId).then(() => {
                $("#modal-packs .updateTab .updateMode").hide();
                $("#modal-packs .updateTab .selectMode").show();
                FrogFlyout.changeMode("idle");
                FrogFlyout.setUIStartMode(false);
                return resolve(true);
            });
        })
    }

    // Получить ID пака из select и начать проверку
    static checkUpdatesBySelect = () => {
        let modpackId = $("#mods-update-pack-select").val();
        FrogModsUpdater.checkPackUpdatesAvailable(modpackId).then(list => {
            $("#modal-packs .updateTab .foundUpdateMode .updatesList").html("");
            $("#modal-packs .updateTab .foundUpdateMode").show();
            $("#modal-packs .updateTab .updateMode").hide();
            list.forEach((item) => {
                $("#modal-packs .updateTab .foundUpdateMode .updatesList").append(`<div class="item"><h2>${item.projectName}</h2><div class="flex flex-align-center flex-gap-4"><span>${item.current}</span> <span class="material-symbols-outlined">arrow_forward</span> <span>${item.latest.version}</span></div></div>`);
            });
        });
    }
}