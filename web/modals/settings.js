function loadSettingsUI() {
    $("#modal-settings input[type='checkbox']").each(function () {
        let setting = $(this).parent().data("setting");
        let defaultChecked = (typeof $(this).parent().data("checked") !== "undefined");
        let rdSetting = FrogConfig.read(setting, defaultChecked);

        if (rdSetting === true) {
            $(this).attr("checked", true);
        }
    })

    // Загрузка цвета в Color Picker
    let colorMatched = false;
    $(".color-picker").each(function () {
        let color = $(this).css("background").split(")")[0] + ")";
        if (color === currentThemeData.color) {
            $(this).addClass("active");
            colorMatched = true;
        }
    });
    if (colorMatched === false) {
        $("#modal-settings .color-picker.custom").val(currentThemeData.color);
    }

    // Загрузка настроек обоев и режима
    $(`#modal-settings .placeholder.${currentThemeData.mode}`).addClass("active");
    let currentWp = FrogConfig.read("currentWallpaper", "1");
    $(`#modal-settings .wp-item[data-wp='${currentWp}']`).addClass("active");

    if (currentWp === "custom") {
        let customWpPath = FrogConfig.read("customWallpaperPath", "");
        if (customWpPath === "" || !fs.existsSync(customWpPath)) {
            FrogThemes.changeWallpaper(1);
        } else {
            $("#modal-settings .wp-item.placeholder").css("background-image", `url(${customWpPath.replaceAll("\\", "/")})`);
        }
    }

    // Директория игры
    $("#gameDirectoryInput").val(GAME_DATA);
}

$(function () {
    // Сохранение настроек при изменении
    $("#modal-settings input[type='checkbox']").on("change", function () {
        let setting = $(this).parent().data("setting");
        let currentValue = $(this).is(":checked");
        FrogConfig.write(setting, currentValue);

        if (setting === "disableAnimations") {
            if (currentValue === true) {
                $("html").addClass("noAnimations");
            } else {
                $("html").removeClass("noAnimations");
            }
        }

        if (setting === "disableCssEffects") {
            if (currentValue === true) {
                $("html").addClass("noEffects");
            } else {
                $("html").removeClass("noEffects");
            }
        }
    })

    // Смена обоев
    $("#modal-settings .wp-item").click(function () {
        if ($(this).hasClass("active")) {
            return;
        }

        if ($(this).data("wp") === "custom") {
            FrogThemes.selectCustomWallpaper().then((result) => {
                if (result !== false) {
                    $("#modal-settings .wp-item.active").removeClass("active");
                    $(this).addClass("active");
                    FrogThemes.changeWallpaper($(this).data("wp"));
                }
            });
        } else {
            $("#modal-settings .wp-item.active").removeClass("active");
            $(this).addClass("active");
            FrogThemes.changeWallpaper($(this).data("wp"));
        }
    })

    // Смена режима dark mode
    $("#modal-settings .placeholder:not(.wp-item)").click(function () {
        if ($(this).hasClass("active")) {
            return;
        }

        $("#modal-settings .placeholder.active").removeClass("active");
        $(this).addClass("active");
        animateCSSNode($("html")[0], "fadeOut").then(() => {
            $("html").hide();
            FrogThemes.changeTheme(false, $(this).data("mode"));
            setTimeout(() => {
                $("html").show();
                animateCSSNode($("html")[0], "fadeIn");
            }, 250);
        })
    })

    // Смена основного цвета
    $(".color-picker:not(.custom)").click(function () {
        if ($(this).hasClass("active")) {
            return;
        }

        $(".color-picker.active").removeClass("active");
        $(this).addClass("active");
        let color = $(this).css("background").split(")")[0] + ")";
        FrogThemes.changeTheme(color);
    })

    $(".color-edit").click(() => {
        $("input.color-picker.custom").trigger("click");
    })

    $(".color-picker.custom").on("change", function () {
        let color = $(this).val();
        let colorRGB = colors.hexToRgb(color);
        FrogThemes.changeTheme(`rgb(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b})`);
        $(".color-picker.active").removeClass("active");
        $(this).addClass("active");
    })

    // Переключение табов
    $("#modal-settings .tabs .tab").click(function () {
        if ($(this).hasClass("active")) {
            return;
        }

        $("#modal-settings .tabs .tab.active").removeClass("active");
        $(this).addClass("active");
        let tabName = $(this).data("tab");
        let tabElem = $(`#modal-settings .layout-tab[data-tab="${tabName}"]`);

        let tabIcon = $(this).find(".material-symbols-outlined").html();
        let tabText = $(this).find("span:not(.material-symbols-outlined)").text();

        $("#settings_currentSection span:not(.material-symbols-outlined)").text(tabText);
        $("#settings_currentSection .material-symbols-outlined").html(tabIcon);
        $("#modal-settings .layout-tab.active").removeClass("active");
        tabElem.addClass("active");
        animateCSSNode(tabElem[0], "fadeIn");

        // Анимация плашки с каждой настройкой
        if (FrogConfig.read("disableAnimations", false) !== true) {
            $(tabElem).find(".settings-item:not(#aboutItem)").each(function (index) {
                $(this).css("opacity", 0);
                setTimeout(() => {
                    animateCSSNode($(this)[0], "fadeIn").then(() => {
                        $(this).css("opacity", 1);
                    })
                }, 80 * index)
            })
        }
    })
});
