let packs__firstAppear = true;

$(function () {
    $(document).on("showModalEvent", (e) => {
        if (e.originalEvent.detail.modal === "installMods") {
            if (packs__firstAppear === true) {
                packs__firstAppear = false;
                FrogPacksUI.reloadAll(true);
            } else {
                FrogPacksUI.refreshDirectorySelect();
            }
        }
    })

    $("#modal-installMods input.search").on("change", function () {
        FrogPacksUI.reloadAll(true);
    })

    $("#modal-installMods #packs_dirList").on("change", function () {
        FrogPacksUI.reloadAll(true);
    })

    // Прогрузка при скролле
    $("#modal-installMods .packs-wrapper").scroll(function () {
        let wrapper = $(this)[0];
        if (wrapper.offsetHeight === wrapper.scrollHeight || packs_scrollIsLoading) {
            return false;
        }
        if (wrapper.offsetHeight + wrapper.scrollTop >= wrapper.scrollHeight) {
            packs_scrollIsLoading = true;
            FrogPacksUI.loadMore();
            return true;
        }
    });
})

// Переключение табов
$("#modal-installMods .tabs.sub .tab").click(function () {
    if ($(this).hasClass("active")) {
        return;
    }

    $("#modal-installMods .tabs.sub .tab.active").removeClass("active");
    $(this).addClass("active");
    let tabName = $(this).data("tab");

    let tabIcon = $(this).find(".material-symbols-outlined").html();
    let tabText = $(this).find("span:not(.material-symbols-outlined)").text();

    $("#packs_currentSection span:not(.material-symbols-outlined)").text(tabText);
    $("#packs_currentSection .material-symbols-outlined").html(tabIcon);

    FrogPacksUI.setCurrentMode(tabName);
    FrogPacksUI.reloadAll(true);
})