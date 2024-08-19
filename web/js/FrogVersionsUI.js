class FrogVersionsUI {
    // Открыть UI версий
    static open = () => {
        if (FrogModals.isModalShown("versions")) {
            return FrogModals.hideModal("versions");
        }
        return FrogModals.showModal("versions");
    }

    // Загрузить список версий в UI
    static loadVersions = () => {
        $(".flyout #versionSelectPlaceholder").show();
        $(".flyout #versionSelect").hide();
        $(".flyout #playButton").hide();

        $("#modal-versions .versions-list .item").unbind("click");
        $("#modal-versions .versions-list .item:not(.placeholder)").remove();
        $("#modal-versions .preloader").show();
        $("#modal-versions .versions-list").hide();
        return new Promise((resolve) => {
            FrogVersionsManager.getPreparedVersions().then(versions => {
                // Получаем код placeholder`а
                let placeholder = $("#modal-versions .versions-list .item.placeholder")[0].outerHTML;
                let activeVersion = FrogVersionsManager.getActiveVersion();
                placeholder = placeholder.replace(' placeholder', "");
                // По placeholder`у добавляем новые элементы

                // Если включено избранное
                let favoritesAllowed = FrogVersionsManager.getFavoriteVersions();
                let installedOnly = FrogVersionsUI.getVersionsTypeSelected().includes("installed");
                let onlyFavorites = FrogVersionsUI.getVersionsTypeSelected().includes("favorite");

                Object.values(versions).forEach((ver) => {
                    let versionIcon = "assets/versions/" + ver.type + ".webp";
                    let displayName = ver.displayName;
                    if (ver.type === "pack") {
                        versionIcon = "assets/icon.png";

                        let modpackData = FrogPacks.getModpackManifest(ver.id.replace("pack-", ""));
                        if (typeof modpackData.icon !== "undefined" && modpackData.icon !== false) {
                            versionIcon = modpackData.icon;

                            if (modpackData.icon === "pack") {
                                versionIcon = path.join(GAME_DATA, "modpacks", modpackData.id, "icon.png");
                            }
                        }

                        if (displayName.indexOf(modpackData.baseVersion.number) === -1) {
                            // Добавляем в название версию игры, если её там нет
                            displayName += ` (${modpackData.baseVersion.number})`;
                        }
                    }
                    if ((!onlyFavorites || (onlyFavorites && favoritesAllowed.includes(ver.id))) && (!installedOnly || (installedOnly && ver.installed === true))) {
                        let preparedPlaceholder = placeholder.replaceAll("$1", displayName).replaceAll("$2", ver.type).replaceAll("$3", ver.id).replaceAll("$4", ver.installed).replaceAll("$5", versionIcon);
                        $("#modal-versions .versions-list").append(preparedPlaceholder);
                    }
                })

                // Помечаем нужные аккаунты в списке активными
                $("#modal-versions .versions-list .item").each(function () {
                    if (!$(this).hasClass("placeholder")) {
                        if ($(this).data("version") === activeVersion) {
                            $(this).addClass("active");
                        }
                        if (favoritesAllowed.includes($(this).data("version"))) {
                            $(this).children(".favorite").addClass("active");
                        }
                        $(this).show();
                    }
                })

                // Биндим клик на смену версии
                $("#modal-versions .versions-list .item").click(function () {
                    $("#modal-versions .versions-list .item.active").removeClass("active");
                    $(this).addClass("active");
                    FrogVersionsManager.setActiveVersion($(this).data("version"));
                    FrogVersionsUI.clearSearch();
                    FrogModals.hideModal("versions");
                })

                $("#modal-versions .versions-list .item .favorite").click(function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    let versionId = $(this).parent().data("version");
                    FrogVersionsManager.addOrRemoveFavorite(versionId);
                    if (!$(this).hasClass("active")) {
                        $(this).addClass("active");
                    } else {
                        $(this).removeClass("active");
                    }
                })

                $("#modal-versions .preloader").hide();
                $("#modal-versions .versions-list").show();
                FrogVersionsUI.reloadButtonUI();
                resolve(true);
            })
        })
    }

    // Перезагрузить кнопку в Flyout (при смене активной версии)
    static reloadButtonUI = () => {
        let $activeVersionItem = $("#modal-versions .versions-list .item.active");
        if ($activeVersionItem.length === 0) {
            $("#versionSelect .title").text(MESSAGES.commons.notSelected);
            $("#versionSelect .icon").hide();
        } else {
            // Проверяем на модпак и на его существование
            let versionName = $activeVersionItem.data("version");
            if (FrogVersionsManager.parseVersionID(versionName).type === "pack") {
                if (!FrogPacks.isModpackExists(versionName.replace("pack-", ""))) {
                    return FrogVersionsManager.setActiveVersion("none");
                }
            }
            if ($activeVersionItem.length < 2) {
                $("#versionSelect .title").text($activeVersionItem.find("span.title").text());
            }
            $("#versionSelect .icon").show();
            $("#versionSelect .icon").attr("src", $activeVersionItem.find("img.icon").attr("src"));
        }
        $(".flyout #versionSelectPlaceholder").hide();
        $(".flyout #versionSelect").show();
        $(".flyout #playButton").show();
        return true;
    }

    // Искать по версиям
    static searchByInput = () => {
        let text = $("#modal-versions input.search").val();
        let searchRegex = new RegExp(text, "gmi");
        $("#modal-versions .versions-list .item:not(.placeholder)").each(function () {
            let versionDisplay = $(this).find(".title").text();

            if (versionDisplay.match(searchRegex) !== null) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    }

    // Сбросить поиск
    static clearSearch = () => {
        $("#modal-versions input.search").val("");
        $("#modal-versions .versions-list .item:not(.placeholder)").each(function () {
            $(this).show();
        });
    }

    // Получить выбранные типы версий
    static getVersionsTypeSelected = () => {
        let selectedList = [];
        $("#modal-versions #versionTypeSelect .chip.active").each(function () {
            selectedList.push($(this).data("type"));
        })
        return selectedList;
    }
}