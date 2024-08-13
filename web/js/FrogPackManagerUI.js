class FrogPackManagerUI {
    // Загрузить пак в модальное окно
    static loadPackByManifest = (manifest) => {
        return new Promise(resolve => {
            // Название и иконка
            $("#modal-packManager > div .icon").attr("src", manifest.icon);
            let versionDisplayName = FrogVersionsManager.versionToDisplayName(manifest.baseVersion.full);
            $("#modal-packManager > div .title").text(manifest.displayName);
            $("#modal-packManager > div .description").text(versionDisplayName);

            // Бинды кнопок
            $("#modal-packManager > div button").off("click");
            $("#modal-packManager > div button.delete").click(() => {

            })
            $("#modal-packManager > div button.folder").click(() => {
                let folderPath = path.join(GAME_DATA, "modpacks", manifest.id);
                openExternal(folderPath);
            })
            $("#modal-packManager > div button.play").click(() => {
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