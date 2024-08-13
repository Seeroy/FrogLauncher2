$(function(){
    $(document).on("showModalEvent", (e) => {
        if (e.originalEvent.detail.modal === "packs") {
            FrogPacksUI.refreshDirectorySelect();
        }
    })
})