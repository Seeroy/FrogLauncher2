let packs__firstAppear = true;

$(function () {
    $(document).on("showModalEvent", (e) => {
        if(packs__firstAppear === true){
            packs__firstAppear = false;
            FrogPacksUI.reloadAll(true);
        } else {
            FrogPacksUI.refreshDirectorySelect();
        }
    })

    $("#modal-packs input.search").on("change", function (e) {
        FrogPacksUI.reloadAll(true);
    })

    $("#modal-packs #packs_dirList").on("change", function (e) {
        FrogPacksUI.reloadAll(true);
    })

    // Прогрузка при скролле
    $("#modal-packs .packs-wrapper").scroll(function (e) {
        let wrapper = $(this)[0];
        if (wrapper.offsetHeight + wrapper.scrollTop >= wrapper.scrollHeight && packs_scrollIsLoading === false) {
            packs_scrollIsLoading = true;
            FrogPacksUI.loadMore();
        }
    });
})

// Переключение главных табов
$("#modal-packs .tabs.main .tab").click(function () {
    if ($(this).hasClass("active")) {
        return;
    }

    $("#modal-packs .tabs.main .tab.active").removeClass("active");
    $(this).addClass("active");
    let tabName = $(this).data("main-tab");
    let tabElem = $(`#modal-packs .layout-tab[data-main-tab="${tabName}"]`);

    $("#modal-packs .layout-tab.active").removeClass("active");
    tabElem.addClass("active");
    animateCSSNode(tabElem[0], "fadeIn");
})

// Переключение табов
$("#modal-packs .tabs.sub .tab").click(function () {
    if ($(this).hasClass("active")) {
        return;
    }

    $("#modal-packs .tabs.sub .tab.active").removeClass("active");
    $(this).addClass("active");
    let tabName = $(this).data("tab");

    let tabIcon = $(this).find(".material-symbols-outlined").html();
    let tabText = $(this).find("span:not(.material-symbols-outlined)").text();

    $("#packs_currentSection span:not(.material-symbols-outlined)").text(tabText);
    $("#packs_currentSection .material-symbols-outlined").html(tabIcon);

    FrogPacksUI.setCurrentMode(tabName);
    FrogPacksUI.reloadAll(true);
})