class FrogLaunchConfigurator {
    // Сгенерировать конфигурацию для определённой версии
    static createConfigForVersion = async (version, javaVersion) => {
        FrogCollector.writeLog(`Config: Preparing launch config [version=${version}] [java=${javaVersion}]`);
        let resultConfig = {};
        if (version.split("-").length < 2) {
            return false;
        }

        // Готовим переменные
        let versionParsed = FrogVersionsManager.parseVersionID(version);

        resultConfig.memory = {
            min: 1500,
            max: FrogConfig.read("xmxMemory")
        }

        // Получаем данные для авторизации
        let activeAccount = FrogAccountsManager.getActiveAccount();
        // Добавляем данные авторизации
        resultConfig.authorization = await FrogAccountsManager.getAccountMCLCData(activeAccount);
        if (!resultConfig.authorization) {
            FrogCollector.writeLog(`Configurator: authorization config data is NULL!`);
            return false;
        }

        // Добавляем данные Java
        if (FrogConfig.read("autoSelectJava") === true) {
            resultConfig.javaPath = FrogJavaManager.getPath(javaVersion);
        } else {
            resultConfig.javaPath = FrogConfig.read("selectedJava");
        }

        FrogCollector.writeLog(`Config: Prepared first version`);
        let moddedLaunchConfig = await FrogLaunchConfigurator.getModdedLaunchConfig(versionParsed.type, versionParsed.name);
        FrogCollector.writeLog(`Config: Prepared modded launch config`);
        resultConfig = {...moddedLaunchConfig, ...resultConfig};
        resultConfig = FrogLaunchConfigurator.applySettingsFixesToConfig(versionParsed, resultConfig);
        FrogCollector.writeLog(`Config: Fixes applied`);
        FrogCollector.writeLog(`Config: Setup of authlib-injector and resolving promises`);

        // Настраиваем authlib-injector
        return FrogLaunchConfigurator.setupAuthlib(resultConfig, activeAccount);
    }

    // Подготовить всё для запуска Ely.by/FrogSkins
    static setupAuthlib = async (config, activeAccount) => {
        let configResult = config;
        let accountType = FrogAccountsManager.getAccount(activeAccount).type;
        if (accountType !== "elyby" && accountType !== "frog") {
            return configResult;
        }

        // Ссылка на API
        let apiUrl = "ely.by";
        if (accountType === "frog") {
            apiUrl = SKINS_API_URL;
        }

        // Очищаем кэш скинов
        FrogSkinsUI.clearSkinsCache();

        // Если аккаунт - Ely.by скачиваем инжектор и добавляем его в конфигурацию
        let authlibInjectorPath = path.join(GAME_DATA, "cache", "authlib-injector.jar");
        if (!fs.existsSync(authlibInjectorPath)) {
            await FrogDownloader.downloadFile(AUTHLIB_INJECTOR_URL, authlibInjectorPath);
        }

        configResult.customArgs.push(`-javaagent:${authlibInjectorPath.replaceAll(/\\/gi, "/")}=${apiUrl}`);
        // Дебаг-режим
        if (IS_APP_IN_DEV) {
            configResult.customArgs.push(`-Dauthlibinjector.debug=verbose,authlib`);
        }
        return configResult;
    }

    // Наложить на конфигурацию фиксы, включенные в настройках лаунчера
    static applySettingsFixesToConfig = (versionData, config) => {
        let configResult = config;
        if (typeof configResult.customArgs != "object") {
            configResult.customArgs = [];
        }
        if (typeof configResult.customLaunchArgs != "object") {
            configResult.customLaunchArgs = [];
        }
        if (typeof configResult.overrides != "object") {
            configResult.overrides = {};
        }

        // Настройка подключения к серверу
        if (!!selectedServerFromList) {
            configResult.customLaunchArgs.push("--server");
            configResult.customLaunchArgs.push(selectedServerFromList.split(":")[0]);
            configResult.customLaunchArgs.push("--port");
            configResult.customLaunchArgs.push(selectedServerFromList.split(":")[1]);
        }

        // Аргументы запуска
        let javaArgs = FrogConfig.read("javaStartParams", "").toString().trim();
        if (javaArgs.length > 0) {
            configResult.customArgs = configResult.customArgs.concat(javaArgs.split(" "));
        }
        let gameArgs = FrogConfig.read("gameStartParams", "").toString().trim();

        // Если есть Xms
        let xmsValue = gameArgs.match(/\-Xms.*(M|G)/gmi);
        if (xmsValue && xmsValue.length >= 1) {
            // Если указано в гигабайтах
            let isGiga = xmsValue[0].slice(-1).toString().toUpperCase() === "G";
            let xmsNumVal = parseInt(xmsValue[0].replaceAll(/[^0-9]/g, ''));
            if (isGiga) {
                xmsNumVal = xmsNumVal * 1024;
            }
            // Задаём параметр
            configResult.memory.min = xmsNumVal;

            // Удаляем Xms из общего списка параметров
            gameArgs = gameArgs.replace(xmsValue[0], "").trim();
        }

        // Добавляем игровые аргументы
        if (gameArgs.length > 0) {
            configResult.customLaunchArgs = configResult.customLaunchArgs.concat(gameArgs.split(" "));
        }

        configResult.window = {};
        // Настройка fullscreen
        configResult.window.fullscreen = FrogConfig.read("gameInFullscreen");
        // Multiplayer fix
        if (FrogConfig.read("multiplayerFix") === true && FrogAccountsManager.getAccount(FrogAccountsManager.getActiveAccount()).type === "local") {
            configResult.customArgs.push("-Dminecraft.api.auth.host=https://froglauncher.fix");
            configResult.customArgs.push("-Dminecraft.api.account.host=https://froglauncher.fix");
            configResult.customArgs.push("-Dminecraft.api.session.host=https://froglauncher.fix");
            configResult.customArgs.push("-Dminecraft.api.services.host=https://froglauncher.fix");
        }
        // Download fix
        // Раздельное хранение
        let separatedPath = path.join(GAME_DATA, "home", "");
        if (!fs.existsSync(separatedPath)) {
            fs.mkdirSync(separatedPath, {recursive: true});
        }
        if (FrogConfig.read("separatedStorage") === true && FrogConfig.read("fullySeparatedStorage") === false) {
            configResult.overrides.gameDirectory = path.join(GAME_DATA, "home", versionData.id);
        }
        let parsedActive = FrogVersionsManager.parseVersionID(FrogVersionsManager.getActiveVersion());
        // Для запуска модпака
        if (parsedActive.type === "pack") {
            configResult.overrides.gameDirectory = path.join(GAME_DATA, "modpacks", parsedActive.name);
        }
        configResult.overrides.maxSockets = 1;
        FrogCollector.writeLog(`Config: Applied user settings`);
        return configResult;
    }

    // Получить конфигурацию tomate для запуска
    static getModdedLaunchConfig = (type, version) => {
        return new Promise(resolve => {
            if (FrogConfig.read("fullySeparatedStorage") === true) {
                ipcRenderer.send("generate-mclc-config", {
                    type: type,
                    version: version,
                    gameData: path.join(GAME_DATA, "home", `${type}-${version}`)
                })
            } else {
                ipcRenderer.send("generate-mclc-config", {
                    type: type,
                    version: version,
                    gameData: GAME_DATA
                })
            }

            ipcRenderer.once("get-mclc-config", (event, result) => {
                FrogCollector.writeLog(`Config: We got modded launch config`);
                resolve(result);
            })
        });
    }
}