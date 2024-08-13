let packman__currentMode = "mods";
let packman__currentModpack = "";

$(function() {
    $("#modal-packManager .tabs .tab").click(function() {
        if(!$(this).hasClass("active")) {
            $("#modal-packManager .tabs .tab.active").removeClass("active");
            $(this).addClass("active");

            packman__currentMode = $(this).data("tab");
        }
    })

    // Установить мод
    $("#modal-packManager .tabs button.install").click(function() {
        $("#modal-packs .search").val("");
        FrogPacksUI.refreshDirectorySelect();
        $(`#modal-packs #packs_dirList`).val(packman__currentModpack.id);
        FrogPacksUI.setCurrentMode(packman__currentMode);
        FrogPacksUI.loadFiltersByModpackID();
        FrogPacksUI.reloadAll(true, false, true);
        FrogModals.hideModal("packManager");
        FrogModals.switchModal("packs");
    })
})

class FrogPackManagerUI {
    // Перезагрузить всё
    static reloadAll = () => {
        if(packman__currentMode === "worlds"){
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
            return resolve(true);
        })
    }

    // Загрузить пак и показать окно
    static loadAndShow = (packId) => {
        if(!FrogPacks.isModpackExists(packId)){
            return false;
        }

        let modpackManifest = FrogPacks.getModpackManifest(packId);
        FrogPackManagerUI.loadPackByManifest(modpackManifest).then(() => {
            FrogModals.showModal("packManager");
        });

        return true;
    }
}