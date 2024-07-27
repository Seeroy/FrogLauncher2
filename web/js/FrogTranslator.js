class FrogTranslator {
    // Получить текущий язык
    static getCurrentLanguage = () => {
        return FrogConfig.read("language", "ru");
    }

    // Задать текущий язык
    static setCurrentLanguage = () => {

    }

    // Получить список доступных языков
    static getAvailableLanguages = () => {
        let result = {};
        let languagesPath = path.join("./languages");
        if (fs.existsSync(languagesPath)) {
            fs.readdirSync(languagesPath).forEach(file => {
                if (path.extname(file) === ".json") {
                    let langFile = JSON.parse(fs.readFileSync(languagesPath).toString());
                    if (typeof langFile.info.code !== "undefined" && typeof langFile.info.id !== "undefined" && typeof langFile.info.displayNameEnglish !== "undefined") {
                        result[langFile.info.code] = langFile.info;
                    }
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
    static isLanguageExists = () => {

    }
}