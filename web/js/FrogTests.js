global.TESTS_LOG = "";

let currentTestingVersion = -1;
let testVersionsList = [];

class FrogTests {
    static startTest = (medVersionStartValue = -1) => {
        FrogVersionsManager.getPreparedVersions().then((prepared) => {
            prepared.forEach((item) => {
                if (item.type === "vanilla" || item.type === "forge" || item.type === "fabric") {
                    if (medVersionStartValue === -1 || item.version.split(".")[1] <= medVersionStartValue) {
                        testVersionsList.push(item);
                    }
                }
            });
            console.log(testVersionsList.length, "vs", prepared.length);
            FrogTests.nextTestingVersion();
        });
    }

    static writeToTestLog = (...data) => {
        let logDate = new Date().toISOString();
        let newPart = "\n" + "[" + logDate + "] " + data.join(" ")
        console.log(data.join(" "));
        fs.appendFileSync(path.join(USERDATA_PATH, "testLogs", "FULLTEST.log"), newPart);
    }

    static writeVersionLog = (data, versionId) => {
        fs.appendFileSync(path.join(USERDATA_PATH, "testLogs", versionId + ".log"), "\n" + data);
    }

    static nextTestingVersion = () => {
        currentTestingVersion++;
        if (typeof testVersionsList[currentTestingVersion] === "undefined") {
            FrogTests.writeToTestLog("TEST COMPLETED");
            FrogFlyout.setText("TEST COMPLETED", "Тестирование завершено");
        }

        let testingId = testVersionsList[currentTestingVersion].id;

        FrogTests.testVersion(testingId).then((testResult, exitCode) => {
            if (testResult === true) {
                FrogTests.writeToTestLog("✓", testingId, "passed tests");
            } else {
                FrogTests.writeToTestLog("X", testingId, "not passed tests, exit code:", exitCode);
            }
            FrogTests.nextTestingVersion();
        })
    }

    // Начать тестирование версии
    static testVersion = (versionId) => {
        return new Promise(resolve => {
            FrogTests.prepareConfig(versionId).then(config => {
                let parsedVersion = FrogVersionsManager.parseVersionID(versionId);
                let starter = new FrogStarter(versionId, parsedVersion.type, parsedVersion.name);
                FrogTests.writeToTestLog("TEST: Starting version " + versionId);
                let useProgress = false;
                // Готовим UI
                FrogFlyout.changeMode("progress").then(() => {
                    FrogTests.writeToTestLog(`Starter: UI preparation completed, starting game`);
                    let launcher = new Client();
                    launcher.launch(config);

                    launcher.on('debug', (e) => {
                        FrogTests.writeVersionLog(e, versionId);
                    });
                    launcher.on('data', (e) => {
                        FrogTests.writeVersionLog(e, versionId);
                        if (e.match(/Sound engine started/gim) !== null || e.match(/OpenAL initialized/gim) !== null || e.match(/Created\: 512x512 textures-atlas/gim) !== null) {
                            FrogFlyout.setText("Игра запущена", versionId);
                            setTimeout(() => {
                                exec("taskkill /F /T /IM java.exe");
                            }, 6000);
                        }
                        if (e.match(/Stopping!/gim) !== null || e.match(/SoundSystem shutting down/gim) !== null) {
                            FrogFlyout.setText("Игра закрывается", versionId);
                        }
                    });
                    launcher.on('close', (exitCode) => {
                        FrogTests.writeToTestLog("Game exit code: " + exitCode);
                        if (exitCode > 0 && exitCode !== 1) {
                            return resolve(false, exitCode);
                        } else {
                            return resolve(true, true);
                        }
                    });
                    launcher.on("arguments", (e) => {
                        gameStarting = true;
                        FrogFlyout.changeMode("spinner");
                        FrogFlyout.setText("Игра запускается", versionId);
                    });
                    launcher.on('progress', (e) => {
                        if (e.type === "assets") {
                            if (startAssetsInterval === 0) {
                                startAssetsInterval = Date.now();
                            }
                            if (assetsVerifyOffset === 0 && (Date.now() - startAssetsInterval) > 1000) {
                                assetsVerifyOffset = (e.task - 1);
                            }
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
                    })
                })
            })
        })
    }

    static prepareConfig = (versionId) => {
        return new Promise((resolve, reject) => {
            let parsedVersion = FrogVersionsManager.parseVersionID(versionId);
            // Готовим UI
            FrogTests.writeToTestLog(`Starter: Preparing UI to start / prepare()`);
            let versionDisplayName = FrogVersionsManager.versionToDisplayName();
            // Получаем версию Java
            FrogJavaManager.gameVersionToJavaVersion(parsedVersion.name).then((javaVersion) => {
                FrogTests.writeToTestLog(`Starter: Using Java ${javaVersion}`);
                if (javaVersion === false) {
                    return reject(false);
                }

                javaVersion = javaVersion.toString();

                FrogTests.writeToTestLog(`Starter: Trying to install Java`);
                // Скачиваем, если нужно
                FrogJavaManager.install(javaVersion, false).then(() => {
                    // Установка Java завершена, получаем к ней путь
                    let javaPath = FrogJavaManager.getPath(javaVersion);
                    if (javaPath === false) {
                        return reject(false);
                    }

                    FrogTests.writeToTestLog(`Starter: Java installation completed`);

                    // Получаем конфигурацию
                    FrogLaunchConfigurator.createConfigForVersion(versionId, javaVersion).then((configuration) => {
                        FrogTests.writeToTestLog(`Starter: Configuration ready`);
                        return resolve(configuration);
                    });
                });
            });
        })
    }
}