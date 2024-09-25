let gameStarting = false;
let assetsVerifyOffset = 0;
let startAssetsInterval = 0;
let gamePid = false;
let killedManually = false;

class FrogStarter {
    constructor(versionId, versionType, versionNumber) {
        this.versionId = versionId
        this.versionType = versionType;
        this.versionNumber = versionNumber;
        this.config = {};
        this.gameRoot = "";
    }

    static kill = () => {
        if (gamePid === false || gameStarting === false) {
            return false;
        }
        treeKill(gamePid);
        killedManually = true;
        return true;
    }

    prepare = async () => {
        this.gameRoot = FrogUtils.getGameRoot(this.versionId);
        FrogCollector.writeLog(`Starter: Preparing UI to start / prepare()`);

        let accData = FrogAccountsManager.getAccount(FrogAccountsManager.getActiveAccount());
        FrogCollector.writeLog(`Starter: Account [type=${accData.type}] [username=${accData.nickname}]`);

        // Получить версию игры для пака
        if (this.versionType === "pack") {
            let verSplit = this.versionId.toString().split("-");
            verSplit.shift();
            let modpackData = FrogPacks.getModpackManifest(verSplit.join("-"));
            FrogCollector.writeLog(`Starter: Starting pack [data=${JSON.stringify(modpackData)}`);
            this.versionNumber = modpackData.baseVersion.number;
            this.versionId = modpackData.baseVersion.full;
            this.versionType = modpackData.baseVersion.type;
        }

        // Готовим UI
        FrogCollector.writeLog(`Starter: id=${this.versionId}; version=${this.versionNumber} type=${this.versionType}`);
        FrogFlyout.setUIStartMode(true);
        let versionDisplayName = FrogVersionsManager.versionToDisplayName();
        FrogFlyout.setText(MESSAGES.starter.configuring, versionDisplayName);
        await FrogFlyout.changeMode("spinner");

        // Получаем версию Java
        FrogCollector.writeLog(`Starter: Gathering Java`);
        let javaVersion = await FrogJavaManager.gameVersionToJavaVersion(this.versionNumber);
        if (javaVersion === false) {
            return false;
        }
        FrogCollector.writeLog(`Starter: Using Java ${javaVersion}`);
        FrogCollector.writeLog(`Starter: Trying to install Java`);

        // Скачиваем, если нужно
        await FrogJavaManager.install(javaVersion, false);

        // Установка Java завершена, получаем к ней путь
        let javaPath = FrogJavaManager.getPath(javaVersion);
        if (javaPath === false) {
            FrogCollector.writeLog(`Starter: Java installation failed! ${javaPath}`);
            return false;
        }
        FrogCollector.writeLog(`Starter: Java installation completed`);

        // Получаем конфигурацию
        let configuration = await FrogLaunchConfigurator.createConfigForVersion(this.versionId, javaVersion);
        if(!configuration){
            FrogCollector.writeLog(`Starter: Error happend with launch config!`);
            return false;
        }
        this.config = configuration;
        FrogCollector.writeLog(`Starter: Configuration ready`);

        // Если версия ForgeOptiFine - скачиваем/переносим файл в моды
        if(this.versionType === "forgeOptiFine"){
            FrogCollector.writeLog(`Starter: Preparing OptiFine`);
            await FrogAssets.setupOptiFine(this.versionNumber, this.gameRoot);
        }

        if (IS_APP_IN_DEV) {
            console.log(configuration);
        }
        return configuration;
    }

    launch = async () => {
        let useProgress = false;
        // Готовим UI
        FrogFlyout.setUIStartMode(true);
        let versionDisplayName = FrogVersionsManager.versionToDisplayName();
        FrogFlyout.setText(MESSAGES.starter.preparingGame, versionDisplayName);
        await FrogFlyout.changeMode("progress");

        // Создаём клиент игры
        FrogCollector.writeLog(`Starter: UI preparation completed, starting game`);
        let launcher = new Client();
        launcher.launch(this.config).then(r => {
            gamePid = r.pid;
        })

        launcher.on('debug', (e) => {
            FrogErrorsParser.parse(e);
            if (IS_APP_IN_DEV) {
                console.log(e);
            }
            FrogCollector.writeLog(e);
        });
        launcher.on('data', (e) => {
            FrogErrorsParser.parse(e);
            if (IS_APP_IN_DEV) {
                console.log(e);
            }
            // Проверки для смены статуса запуска
            if (e.match(/Sound engine started/gim) !== null || e.match(/OpenAL initialized/gim) !== null || e.match(/Created\: 512x512 textures-atlas/gim) !== null) {
                FrogFlyout.setText(MESSAGES.starter.started, versionDisplayName);
            }
            if (e.match(/Stopping!/gim) !== null) {
                FrogFlyout.setText(MESSAGES.starter.closing, versionDisplayName);
                FrogUI.appearMainWindow();
            }
            FrogCollector.writeLog(e);
        });
        launcher.on('close', (exitCode) => {
            // Удаляем OptiFine
            if(this.versionType === "forgeOptiFine"){
                FrogAssets.removeOptiFine(this.versionNumber, this.gameRoot);
            }

            gamePid = false;
            gameStarting = false;
            assetsVerifyOffset = 0;
            startAssetsInterval = 0;

            // Показываем все нужные элементы
            FrogPlayStats.onGameClose();
            $("#stopGameButton").hide();
            FrogUI.appearMainWindow();
            setTimeout(() => {
                FrogFlyout.setUIStartMode(false);
                FrogFlyout.changeMode("idle");
            }, 1000);

            // Если лаунчер не убит вручную - проверяем стоп-код
            if(!killedManually){
                FrogErrorsParser.parse("", exitCode);
                if (exitCode > 0 && exitCode !== 127 && exitCode !== 255 && exitCode !== 1 && FrogConfig.read("consoleOnCrash") === true) {
                    FrogModals.switchModal("console");
                }
            }
            killedManually = false;
            if (IS_APP_IN_DEV) {
                console.log("Game exit code: " + exitCode);
            }
            FrogCollector.writeLog("Game exit code: " + exitCode);
        });
        launcher.on("arguments", (e) => {
            gameStarting = true;
            selectedServerFromList = false;
            FrogPlayStats.onGameLaunch(FrogVersionsManager.getActiveVersion());
            $("#stopGameButton").show();
            // Показываем консоль
            if (FrogConfig.read("consoleOnStart") === true) {
                FrogModals.switchModal("console");
            }
            setTimeout(() => {
                // Скрываем окно, если включено в настройках
                if (gameStarting && FrogConfig.read("hideLauncherOnStart") === true) {
                    FrogUI.disappearMainWindow();
                }
            }, 4000);
            FrogFlyout.changeMode("spinner");
            FrogFlyout.setText(MESSAGES.starter.starting, versionDisplayName);
        });
        launcher.on('progress', (e) => {
            if (e.type === "assets") {
                if (startAssetsInterval === 0) {
                    startAssetsInterval = Date.now();
                }
                if (assetsVerifyOffset === 0 && (Date.now() - startAssetsInterval) > 1000) {
                    assetsVerifyOffset = (e.task - 1);
                }
            } else {
                assetsVerifyOffset = 0;
            }
            if (useProgress === true) {
                let taskOffset = e.task - assetsVerifyOffset;
                let totalOffset = e.total - assetsVerifyOffset;
                let percent = Math.round((taskOffset * 100) / totalOffset);
                FrogDownloader.updateDownloadUIText(e.type, percent, taskOffset, totalOffset);
            }
        });
        launcher.on('download-status', (e) => {
            if ((e.total / 1024 / 1024) >= 4) {
                useProgress = false;
                let percent = Math.round((e.current * 100) / e.total);
                FrogDownloader.updateDownloadUI(e.name, percent, e.current, e.total);
            } else {
                useProgress = true;
            }
        });
        return true;
    }

    // Просто запустить версию по ID
    static simpleStart = async (versionId) => {
        let parsedVersion = FrogVersionsManager.parseVersionID(versionId);
        let starter = new FrogStarter(versionId, parsedVersion.type, parsedVersion.name);
        await starter.prepare();

        if (parsedVersion.type === "pack") {
            await FrogPacks.verifyAndInstall(parsedVersion.name);
        }
        return starter.launch();
    }
}