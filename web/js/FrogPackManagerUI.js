let packman__currentMode = "mods";
let packman__currentModpack = "";

$(function () {
    $("#modal-packManager .tabs .tab").click(function () {
        if (!$(this).hasClass("active")) {
            $("#modal-packManager .tabs .tab.active").removeClass("active");
            $(this).addClass("active");

            packman__currentMode = $(this).data("tab");
            FrogPackManagerUI.reloadAll();
        }
    })

    // Установить из репозитория
    $("#modal-packManager .tabs button.install").click(function () {
        $("#modal-packs .search").val("");
        FrogPacksUI.refreshDirectorySelect();
        $(`#modal-packs #packs_dirList`).val(packman__currentModpack.id);
        FrogPacksUI.setCurrentMode(packman__currentMode);
        FrogPacksUI.loadFiltersByModpackID();
        FrogPacksUI.reloadAll(true, false, true);
        FrogModals.hideModal("packManager");
        FrogModals.switchModal("packs");
    })

    // Выбрать файл
    $("#modal-packManager .tabs button.add").click(function () {
        let properties = {
            filters: [{name: "Zip file", extensions: ["zip"]}]
        }
        if (packman__currentMode === "mods") {
            properties = {
                filters: [{name: "Jar file", extensions: ["jar"]}]
            }
        }
        ipcRenderer.invoke("open-dialog", properties).then(result => {
            if(result === false){
                return;
            }
            let fileName = path.basename(result[0]);
            if (packman__currentMode !== "worlds") {
                let fileNewPath = path.join(GAME_DATA, "modpacks", packman__currentModpack.id, packman__currentMode, fileName);
                if (!fs.existsSync(path.dirname(fileNewPath))) {
                    fs.mkdirSync(path.dirname(fileNewPath));
                }
                fsExtra.moveSync(result[0], fileNewPath);
                FrogToasts.create(fileName, "download_done", MESSAGES.packManager.installed);
                return FrogPackManagerUI.reloadAll();
            } else {
                let savesDirectory = path.join(GAME_DATA, "modpacks", packman__currentModpack.id, "saves");
                if (!fs.existsSync(savesDirectory)) {
                    fs.mkdirSync(savesDirectory);
                }
                FrogWorldsManager.installFromZip(savesDirectory, result[0]).then(result => {
                    if (!result) {
                        FrogToasts.create(fileName, "error", MESSAGES.packManager.failedWorld);
                    } else {
                        FrogToasts.create(fileName, "download_done", MESSAGES.packManager.successWorld);
                    }
                    return FrogPackManagerUI.reloadAll();
                })
            }
        })
    })
})

class FrogPackManagerUI {
    // Перезагрузить всё
    static reloadAll = () => {
        if (packman__currentMode === "worlds") {
            $("#modal-packManager .tabs button.install").hide();
        } else {
            $("#modal-packManager .tabs button.install").show();
        }
    }

    // Загрузить пак в модальное окно
    static loadPackByManifest = (manifest) => {
        packman__currentModpack = manifest;
        return new Promise(resolve => {
            // Название и иконка
            $("#modal-packManager .title-wrapper .icon").attr("src", manifest.icon);
            let versionDisplayName = FrogVersionsManager.versionToDisplayName(manifest.baseVersion.full);
            $("#modal-packManager .title-wrapper .title").text(manifest.displayName);
            $("#modal-packManager .title-wrapper .description").text(versionDisplayName);

            // Бинды кнопок
            $("#modal-packManager .title-wrapper button").off("click");
            $("#modal-packManager .title-wrapper button.delete").click(() => {

            })
            $("#modal-packManager .title-wrapper button.folder").click(() => {
                let folderPath = path.join(GAME_DATA, "modpacks", manifest.id);
                openExternal(folderPath);
            })
            $("#modal-packManager .title-wrapper button.play").click(() => {
                FrogStarter.simpleStart("pack-" + manifest.id);
                FrogModals.hideModal("packManager");
            })
            FrogPackManagerUI.reloadAll();
            return resolve(true);
        })
    }

    // Загрузить пак и показать окно
    static loadAndShow = (packId) => {
        if (!FrogPacks.isModpackExists(packId)) {
            return false;
        }

        let modpackManifest = FrogPacks.getModpackManifest(packId);
        FrogPackManagerUI.loadPackByManifest(modpackManifest).then(() => {
            FrogModals.showModal("packManager");
        });

        return true;
    }
}