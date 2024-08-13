class FrogPackManagerUI {
    // Загрузить пак в модальное окно
    static loadPackByManifest = (manifest) => {
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