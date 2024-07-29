global.MESSAGES = {};

class FrogTranslator {
    // Поиск и замена значений в HTML
    static translateAllNodes = () => {
        let currentLangData = FrogTranslator.getCurrentLanguageData().translations;
        let $selector = $("button,span:not(.material-symbols-outlined):not(.icon):not(.avatar),p,h1,h2,h3,h4,h5");
        $selector.each(function () {
            if((this.tagName === "BUTTON" && $(this).children().length === 0) || this.tagName !== "BUTTON"){
                let itemText = $(this).text();
                // Переводим текст
                let translated = FrogTranslator.translateText(currentLangData, itemText);
                if (translated !== false) {
                    $(this).text(translated);
                }
            }
        })

        // Переводим плейсхолдеры полей ввода
        let $selector2 = document.getElementsByTagName('input');
        for (let index = 0; index < $selector2.length; ++index) {
            let $element = $($selector2[index]);
            let itemText = $element.attr('placeholder');

            if(typeof itemText !== "undefined"){
                // Переводим текст
                let translated = FrogTranslator.translateText(currentLangData, itemText);
                if (translated !== false) {
                    $element.attr('placeholder', translated);
                }
            }
        }

        let $selector3 = document.getElementsByTagName('div');
        for (let index = 0; index < $selector3.length; ++index) {
            let $element = $($selector3[index]);
            let itemText = $element.data("text");

            if(typeof itemText !== "undefined"){
                // Переводим текст
                let translated = FrogTranslator.translateText(currentLangData, itemText);
                if (translated !== false) {
                    $element.data("text", translated);
                }
            }
        }
    }

    // Загрузить список языков в UI
    static loadLanguagesList = () => {
        let langData = Object.values(FrogTranslator.getAvailableLanguagesDetails());
        // Получаем код placeholder`а
        let placeholder = $("#modal-settings #languages-list .item.placeholder")[0].outerHTML;
        placeholder = placeholder.replaceAll(' placeholder', "").replaceAll(' display: none', "");
        // По placeholder`у добавляем новые элементы
        Object.values(langData).forEach((lang) => {
            let preparedPlaceholder = placeholder.replaceAll("$1", lang.displayName).replaceAll("$2", lang.displayNameEnglish).replaceAll("$3", lang.author).replaceAll("$4", lang.id);
            let $insertedElem = $("#modal-settings #languages-list").append(preparedPlaceholder);
        })

        // Помечаем нужные аккаунты в списке активными
        $("#modal-settings #languages-list .item").each(function () {
            if (!$(this).hasClass("placeholder")) {
                if ($(this).data("lang") === FrogTranslator.getCurrentLanguage()) {
                    $(this).addClass("active");
                }
                $(this).show();
            }
        })
    }

    // Перевести текст
    static translateText = (languageData, text) => {
        text = text.toString();
        // Ищем все совпадения по тегу {{..]}
        let itemMatches = text.match(/\{{[0-9a-zA-Z\-_.]+\}}/gm);
        if (itemMatches !== null) {
            itemMatches.forEach(match => {
                // Чистим match-и от скобок и делим на категорию и ключ
                let matchClear = match.replaceAll("{", "").replaceAll("}", "");

                // Если нашли перевод в данных - меняем текст
                let messageByKey = FrogUtils.parseNestedObjectPath(matchClear, languageData);
                if (messageByKey !== false) {
                    text = text.replaceAll(match, messageByKey);
                }
            })
            return text;
        }
        return false;
    }

    // Получить текущий язык
    static getCurrentLanguage = () => {
        let defaultValue = "ru";
        let defaultSystem = FrogTranslator.getSystemLanguage();
        if (FrogTranslator.isLanguageExists(defaultSystem)) {
            defaultValue = defaultSystem;
        }
        return FrogConfig.read("language", defaultValue);
    }

    // Получить данные для текущего языка
    static getCurrentLanguageData = () => {
        let currentLang = FrogTranslator.getCurrentLanguage();
        let langPath = path.join("./languages", `${currentLang}.json`);
        let langData = JSON.parse(fs.readFileSync(langPath));

        return langData;
    }

    // Загрузить данные языка в переменную (для JS)
    static loadCurrentLanguageToGlobalVariable = () => {
        global.MESSAGES = FrogTranslator.getCurrentLanguageData().translations;
    }

    // Задать текущий язык
    static setCurrentLanguage = (language) => {
        if (FrogTranslator.isLanguageExists(language)) {
            FrogConfig.write("language", language);
            FrogUI.reloadMainWindow();
            return true;
        }
        return false;
    }

    // Получить список доступных языков в деталях
    static getAvailableLanguagesDetails = () => {
        let result = {};
        let languagesList = FrogTranslator.getAvailableLanguages();

        languagesList.forEach((item) => {
            let langFile = JSON.parse(fs.readFileSync(path.join("./languages", `${item}.json`)));
            if (typeof langFile.info.code !== "undefined" && typeof langFile.info.id !== "undefined" && typeof langFile.info.displayNameEnglish !== "undefined") {
                result[langFile.info.code] = langFile.info;
            }
        })
        return result;
    }

    // Получить список доступных языков
    static getAvailableLanguages = () => {
        let result = [];
        let languagesPath = path.join("./languages");
        if (fs.existsSync(languagesPath)) {
            fs.readdirSync(languagesPath).forEach(file => {
                if (path.extname(file) === ".json") {
                    result.push(path.basename(file).split(".")[0]);
                }
            })
            return result;
        }
        return false;
    }

    // Получить язык в системе
    static getSystemLanguage = () => {
        return navigator.language;
    }

    // Существует ли такой язык
    static isLanguageExists = (language) => {
        return FrogTranslator.getAvailableLanguages().includes(language);
    }
}