let colorsMatchRegex = /rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/

class FrogThemes {
    // Создать тему и сделать её активной
    static generateAndLoad = (color, mode) => {
        let darkMode;
        if (mode !== "light" && mode !== "dark") {
            return false;
        }

        mode === "dark" ? darkMode = true : darkMode = false;

        let genResult = FrogThemes.themeFromColor(color, darkMode);
        if (genResult === false) {
            return false;
        }

        FrogThemes.loadThemeVariables(genResult);
        FrogThemes.applyModeClasses(mode);
        return true;
    }

    // Переключение тёмного и светлого режимов
    static applyModeClasses = (mode) => {
        if (mode !== "light" && mode !== "dark") {
            return false;
        }

        $("html").removeClass("dark light");
        $("html").addClass(mode);
        return true;
    }

    // Изменить тему
    static changeTheme = (color = false, mode = false) => {
        FrogCollector.writeLog(`ThemeEngine: Reloading [color=${color}] [mode=${mode}]`);
        let selColor, selMode;

        if (color === false) {
            selColor = currentThemeData.color;
        } else {
            selColor = color;
            currentThemeData.color = color;
        }

        if (mode === false) {
            selMode = currentThemeData.mode;
        } else {
            selMode = mode;
            currentThemeData.mode = mode;
        }

        FrogThemes.generateAndLoad(selColor, selMode);
        FrogThemes.saveCurrentTheme();
    }

    // Сгенерировать тему из цвета
    static themeFromColor = (color, darkMode = true) => {
        let matched = color.match(colorsMatchRegex);
        if (matched === null || matched.length !== 4) {
            return false;
        }

        let r = matched[1];
        let g = matched[2];
        let b = matched[3];

        let primary = `rgb(${r}, ${g}, ${b})`;
        let hslValue = colors.RGBToHSL(r, g, b);
        let primaryDarker = `hsl(${hslValue.h}, 100%, 35%)`;
        let primaryLighter = `hsl(${hslValue.h}, 100%, 60%)`;
        let primaryBg, primaryBgLight, primaryBgLighter, primaryBgShadow;
        if (darkMode === true) {
            primaryBg = `hsl(${hslValue.h}, 50%, 10%)`;
            primaryBgShadow = `hsla(${hslValue.h}, 50%, 10%, 0.3)`;
            primaryBgLight = `hsl(${hslValue.h}, 50%, 16%)`;
            primaryBgLighter = `hsl(${hslValue.h}, 50%, 21%)`;
        } else {
            primaryBg = `hsl(${hslValue.h}, 100%, 100%)`;
            primaryBgShadow = `hsla(${hslValue.h}, 100%, 100%, 0.3)`;
            primaryBgLight = `hsl(${hslValue.h}, 30%, 95%)`;
            primaryBgLighter = `hsl(${hslValue.h}, 30%, 89%)`;
        }

        let primaryHex = colors.rgbToHex(r, g, b);
        let textColor;
        colors.isColorLight(primaryHex) ? textColor = "black" : textColor = "white";

        FrogCollector.writeLog(`ThemeEngine: Generation of theme completed`);

        return {
            primary: primary,
            primaryDarker: primaryDarker,
            primaryLighter: primaryLighter,
            primaryBg: primaryBg,
            primaryBgLight: primaryBgLight,
            primaryBgLighter: primaryBgLighter,
            primaryBgShadow: primaryBgShadow,
            hue: hslValue.h,
            text: textColor
        }
    }

    // Загрузить параметры активной темы
    static loadThemeVariables = (themeData) => {
        Object.keys(themeData).forEach((key) => {
            loadedThemeData[key] = themeData[key];
            $(":root")[0].style.setProperty("--theme-" + key, themeData[key]);
        });
        return true;
    }

    // Сохранить тему в конфиг
    static saveCurrentTheme = () => {
        return FrogConfig.write("theme", currentThemeData);
    }

    // Сменить обои (1-5)
    static changeWallpaper = (wpId) => {
        FrogCollector.writeLog(`ThemeEngine: Updated wallpaper : ${wpId}`);
        if (5 >= parseInt(wpId) > 0) {
            $(".background.img").removeClass("img-1 img-2 img-3 img-4 img-5");
            $(".background.img").addClass(`img-${wpId}`);
            FrogConfig.write("currentWallpaper", wpId);
            return true;
        }
        return false;
    }
}