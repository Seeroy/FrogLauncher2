$(function () {
    $(document).on("showModalEvent", (e) => {
        if (e.originalEvent.detail.modal === "packs") {
            FrogPacksUI.refreshDirectorySelect();
        }
    })

    $("#modal-packs .item.add button.install").click(function () {
        FrogPacksUI.setCurrentMode("modpacks");
        FrogPacksUI.reloadAll(true, true, true);
        FrogModals.hideModal("packManager");
        FrogModals.switchModal("installMods");
    })

    $("#modal-packs .item.add button.create").click(function () {
        FrogPacksUI.setCurrentMode("modpacks");
        FrogPacksUI.reloadAll(true, true, true);
        FrogModals.showModal("createPack");
    })

    $("#modal-packs .item.add button.import").click(function () {
        FrogPacks.importModpack();
    })
})