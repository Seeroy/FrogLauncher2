class FrogTranslator {
    // Поиск и замена значений в HTML
    static translateAllNodes = () => {
        let currentLangData = FrogTranslator.getCurrentLanguageData().translations;
        let $selector = $("span:not(.material-symbols-outlined),p,h1,h2,h3,h4,h5");
        $selector.each(function () {
            let itemText = $(this).text();
            // Переводим текст
            $(this).text(FrogTranslator.translateText(currentLangData, itemText));
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
        }
        return text;
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
        return JSON.parse(fs.readFileSync(langPath));
    }

    // Задать текущий язык
    static setCurrentLanguage = (language) => {
        if (FrogTranslator.isLanguageExists(language)) {
            FrogConfig.write("language", language);

            // TODO: Смена языка
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
                    result.push(path.basename(file));
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