class FrogLaunchConfigurator {
    // Сгенерировать конфигурацию для определённой версии
    static createConfigForVersion = (version, javaVersion) => {
        FrogCollector.writeLog(`Config: Preparing launch config [version=${version}] [java=${javaVersion}]`);
        return new Promise(resolve => {
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
            let activeAccountData = FrogAccountsManager.getAccount(activeAccount);
            FrogAccountsManager.getAccountMCLCData(activeAccount, (authData) => {
                // Добавляем данные авторизации
                resultConfig.authorization = authData;

                // Добавляем данные Java
                if (FrogConfig.read("autoSelectJava") === true) {
                    resultConfig.javaPath = FrogJavaManager.getPath(javaVersion);
                } else {
                    resultConfig.javaPath = FrogConfig.read("selectedJava");
                }

                FrogCollector.writeLog(`Config: Created successfully, resolving promise`);
                FrogLaunchConfigurator.getModdedLaunchConfig(versionParsed.type, versionParsed.name).then(moddedLaunchConfig => {
                    resultConfig = {...moddedLaunchConfig, ...resultConfig};
                    resultConfig = FrogLaunchConfigurator.applySettingsFixesToConfig(resultConfig);
                    // Готовим конфиг для ely.by, если надо
                    FrogLaunchConfigurator.setupForSkinSystems(resultConfig, activeAccount).then((resultConfigFinal) => {
                        return resolve(resultConfigFinal);
                    })
                })
            });
        })
    }

    // Подготовить всё для запуска Ely.by/FrogSkins
    static setupForSkinSystems = (config, activeAccount) => {
        return new Promise(resolve => {
            let configResult = config;
            let accountType = FrogAccountsManager.getAccount(activeAccount).type;
            if (accountType !== "elyby" && accountType !== "frog") {
                return resolve(configResult);
            }
            let apiUrl = "ely.by";
            if(accountType === "frog"){
                apiUrl = global.SKINS_API_URL.replace("https://", "");
            }
            // Очищаем кэш скинов
            FrogSkinsUI.clearSkinsCache();
            // Если аккаунт - Ely.by скачиваем инжектор и добавляем его в конфигурацию
            let authlibInjectorPath = path.join(global.GAME_DATA, "cache", "authlib-injector.jar");
            if (!fs.existsSync(authlibInjectorPath)) {
                FrogDownloader.downloadFile(global.AUTHLIB_INJECTOR_URL, authlibInjectorPath).then(() => {
                    configResult.customArgs.push(`-javaagent:${authlibInjectorPath.replaceAll(/\\/gi, "/")}=${apiUrl}`);
                    if(global.IS_APP_IN_DEV){
                        configResult.customArgs.push(`-Dauthlibinjector.debug=verbose,authlib`);
                    }
                    return resolve(configResult);
                })
            } else {
                configResult.customArgs.push(`-javaagent:${authlibInjectorPath.replaceAll(/\\/gi, "/")}=${apiUrl}`);
                if(global.IS_APP_IN_DEV){
                    configResult.customArgs.push(`-Dauthlibinjector.debug=verbose,authlib`);
                }
                return resolve(configResult);
            }
        })
    }

    // Наложить на конфигурацию фиксы, включенные в настройках лаунчера
    static applySettingsFixesToConfig = (config) => {
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
        let separatedPath = path.join(global.GAME_DATA, "home", "");
        if (!fs.existsSync(separatedPath)) {
            fs.mkdirSync(separatedPath, {recursive: true});
        }
        if (FrogConfig.read("separatedStorage") === true && FrogConfig.read("fullySeparatedStorage") === false) {
            configResult.overrides.gameDirectory = path.join(global.GAME_DATA, "home", (config?.version?.custom || config?.version?.number));
        }
        let parsedActive = FrogVersionsManager.parseVersionID(FrogVersionsManager.getActiveVersion());
        // Для запуска модпака
        if (parsedActive.type === "pack") {
            configResult.overrides.gameDirectory = path.join(global.GAME_DATA, "modpacks", parsedActive.name);
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
                    gameData: path.join(global.GAME_DATA, "home", `${type}-${version}`)
                })
            } else {
                ipcRenderer.send("generate-mclc-config", {
                    type: type,
                    version: version,
                    gameData: global.GAME_DATA
                })
            }

            ipcRenderer.once("get-mclc-config", (event, result) => {
                FrogCollector.writeLog(`Config: We got modded launch config`);
                resolve(result);
            })
        });
    }
}