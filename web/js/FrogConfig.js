let mainConfig;
let defaultConfig = {
    accounts: [],
    theme: {
        mode: 'dark',
        color: "rgb(10, 115, 255)"
    }
};

class FrogConfig {
    // Прочитать конфиг-файл
    static readConfig() {
        if (fs.existsSync(global.CONFIG_PATH)) {
            return JSON.parse(fs.readFileSync(global.CONFIG_PATH));
        } else {
            this.writeConfig(defaultConfig);
            return defaultConfig;
        }
    }

    // Записать конфиг-файл
    static writeConfig(config) {
        fs.writeFileSync(
            global.CONFIG_PATH,
            JSON.stringify(config, null, "\t")
        );
        FrogCollector.writeLog("Main configuration saved");
        return true;
    }

    // Прочитать переменную из конфига
    static read = (key, defaultValue = true) => {
        if (!this.isKeyExists(key)) {
            this.write(key, defaultValue);
            return defaultValue;
        }
        return mainConfig[key];
    };

    // Записать переменную в конфиг
    static write = (key, value) => {
        mainConfig[key] = value;
        return this.writeConfig(mainConfig);
    }

    // Существует ли ключ в конфиге
    static isKeyExists = (key) => {
        if(typeof mainConfig === "undefined"){
            return false;
        }
        return typeof mainConfig[key] !== "undefined";
    }
}

mainConfig = FrogConfig.readConfig();