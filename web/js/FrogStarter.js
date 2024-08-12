let gameStarting = false;
let assetsVerifyOffset = 0;
let startAssetsInterval = 0;
let gamePid = false;

class FrogStarter {
    constructor(versionId, versionType, versionNumber) {
        this.versionId = versionId
        this.versionType = versionType;
        this.versionNumber = versionNumber;
        this.config = {};
    }

    static kill = () => {
        if (gamePid === false || gameStarting === false) {
            return false;
        }
        treeKill(gamePid);
        return true;
    }

    prepare = () => {
        return new Promise((resolve, reject) => {
            // Получить версию игры для пака
            if (this.versionType === "pack") {
                let verSplit = this.versionId.toString().split("-");
                verSplit.shift();
                let modpackData = FrogPacks.getModpackManifest(verSplit.join("-"));
                this.versionNumber = modpackData.baseVersion.number;
                this.versionId = modpackData.baseVersion.full;
                this.versionType = modpackData.baseVersion.type;
            }
            // Готовим UI
            FrogCollector.writeLog(`Starter: Preparing UI to start / prepare()`);
            FrogFlyout.setUIStartMode(true);
            let versionDisplayName = FrogVersionsManager.versionToDisplayName();
            FrogFlyout.setText(MESSAGES.starter.configuring, versionDisplayName);
            FrogFlyout.changeMode("spinner").then(() => {
                // Получаем версию Java
                FrogJavaManager.gameVersionToJavaVersion(this.versionNumber).then((javaVersion) => {
                    FrogCollector.writeLog(`Starter: Using Java ${javaVersion}`);
                    if (javaVersion === false) {
                        return reject(false);
                    }

                    javaVersion = javaVersion.toString();

                    FrogCollector.writeLog(`Starter: Trying to install Java`);
                    // Скачиваем, если нужно
                    FrogJavaManager.install(javaVersion, false).then(() => {
                        // Установка Java завершена, получаем к ней путь
                        let javaPath = FrogJavaManager.getPath(javaVersion);
                        if (javaPath === false) {
                            return reject(false);
                        }

                        FrogCollector.writeLog(`Starter: Java installation completed`);

                        // Получаем конфигурацию
                        FrogLaunchConfigurator.createConfigForVersion(this.versionId, javaVersion).then((configuration) => {
                            this.config = configuration;
                            FrogCollector.writeLog(`Starter: Configuration ready`);
                            if (global.IS_APP_IN_DEV) {
                                console.log(configuration);
                            }
                            return resolve(configuration);
                        });
                    });
                });
            });
        })
    }

    launch = () => {
        let useProgress = false;
        // Готовим UI
        FrogFlyout.setUIStartMode(true);
        let versionDisplayName = FrogVersionsManager.versionToDisplayName();
        FrogFlyout.setText(MESSAGES.starter.preparingGame, versionDisplayName);
        FrogFlyout.changeMode("progress").then(() => {
            FrogCollector.writeLog(`Starter: UI preparation completed, starting game`);
            let launcher = new Client();
            launcher.launch(this.config).then(r => {
                gamePid = r.pid;
            })

            launcher.on('debug', (e) => {
                FrogErrorsParser.parse(e);
                if (global.IS_APP_IN_DEV) {
                    console.log(e);
                }
                FrogCollector.writeLog(e);
            });
            launcher.on('data', (e) => {
                FrogErrorsParser.parse(e);
                if (global.IS_APP_IN_DEV) {
                    console.log(e);
                }
                if (e.match(/Sound engine started/gim) !== null || e.match(/OpenAL initialized/gim) !== null || e.match(/Created\: 512x512 textures-atlas/gim) !== null) {
                    FrogFlyout.setText(MESSAGES.starter.started, versionDisplayName);
                }
                if (e.match(/Stopping!/gim) !== null || e.match(/SoundSystem shutting down/gim) !== null) {
                    FrogFlyout.setText(MESSAGES.starter.closing, versionDisplayName);
                    FrogUI.appearMainWindow();
                }
                FrogCollector.writeLog(e);
            });
            launcher.on('close', (exitCode) => {
                gamePid = false;
                gameStarting = false;
                assetsVerifyOffset = 0;
                startAssetsInterval = 0;
                $("#stopGameButton").hide();
                FrogUI.appearMainWindow();
                setTimeout(() => {
                    FrogFlyout.setUIStartMode(false);
                    FrogFlyout.changeMode("idle");
                }, 1000);
                FrogErrorsParser.parse("", exitCode);
                if (exitCode > 0 && exitCode !== 127 && exitCode !== 255 && exitCode !== 1 && FrogConfig.read("consoleOnCrash") === true) {
                    FrogUI.showConsole();
                }
                if (global.IS_APP_IN_DEV) {
                    console.log("Game exit code: " + exitCode);
                }
                FrogCollector.writeLog("Game exit code: " + exitCode);
            });
            launcher.on("arguments", (e) => {
                gameStarting = true;
                $("#stopGameButton").show();
                // Показываем консоль
                if (FrogConfig.read("consoleOnStart") === true) {
                    FrogUI.showConsole();
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
        });
        return true;
    }

    // Просто запустить версию по ID
    static simpleStart = (versionId) => {
        let parsedVersion = FrogVersionsManager.parseVersionID(versionId);
        let starter = new FrogStarter(versionId, parsedVersion.type, parsedVersion.name);
        starter.prepare().then(() => {
            let parsedVersion = FrogVersionsManager.parseVersionID(versionId);
            if (parsedVersion.type === "pack") {
                FrogPacks.verifyAndInstall(parsedVersion.name).then(() => {
                    starter.launch();
                })
            } else {
                starter.launch();
            }
        })
    }
}