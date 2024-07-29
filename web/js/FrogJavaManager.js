let javaInstallationDirectory;

class FrogJavaManager {
    // Установить версию Java
    static install = (version, restoreStartMode = false) => {
        return new Promise(resolve => {
            if (FrogJavaManager.isInstalled(version)) {
                return resolve(true);
            }
            // Готовим UI
            FrogFlyout.setUIStartMode(true);
            FrogFlyout.setText();
            FrogFlyout.setProgress(-1);
            FrogFlyout.changeMode("spinner").then(() => {
                // Получаем информацию
                let info = FrogJavaManager.getByVersion(version);
                // Скачиваем
                FrogDownloader.downloadFile(info.url, info.downloadPath, `Java ${version}`, true).then(() => {
                    // Меняем UI
                    FrogFlyout.changeMode("spinner").then(() => {
                        FrogFlyout.setText(`${MESSAGES.java.unpacking} ${version}`);
                    });
                    // Распаковываем
                    fs.mkdirSync(info.unpackPath, {recursive: true});
                    decompress(info.downloadPath, info.unpackPath)
                        .then(function () {
                            // Успешно!
                            fs.unlinkSync(info.downloadPath);
                            if (restoreStartMode) {
                                FrogFlyout.setUIStartMode(false);
                                FrogFlyout.changeMode("idle");
                            }
                            FrogToasts.create(`Java ${version}`, "info", MESSAGES.java.installed);
                            return resolve(true);
                        })
                        .catch(function (error) {
                            // Неудачно :(
                            console.error(error);
                            if (restoreStartMode) {
                                FrogFlyout.setUIStartMode(false);
                                FrogFlyout.changeMode("idle");
                            }
                            FrogToasts.create(`Java ${version}`, "error", MESSAGES.java.failed);
                            return resolve(false);
                        });
                });
            });
        })
    }

    // Инициализация директории
    static init = () => {
        javaInstallationDirectory = path.join(global.GAME_DATA, "javaDownloads");
        FrogUtils.createMissingDirectories(javaInstallationDirectory);
    };

    // Получить локально установленные версии Java
    static getLocal = () => {
        let rdResult = fs.readdirSync(javaInstallationDirectory);
        rdResult = rdResult.filter(entry => fs.lstatSync(path.join(javaInstallationDirectory, entry)).isDirectory());
        return rdResult;
    }

    // Проверить, скачана ли требуемая версия Java
    static isInstalled = (version) => {
        return this.getLocal().includes(version);
    }

    // Получить информацию о Java по версии
    static getByVersion = (javaVersion) => {
        let platformName = "";
        let fileExtension = "";
        let platformArch = "";

        if (process.platform === "win32") {
            platformName = "windows";
            fileExtension = ".zip";
        } else if (process.platform === "linux") {
            platformName = "linux";
            fileExtension = ".tar.gz";
        } else {
            return false;
        }

        if (process.arch === "x64") {
            platformArch = "x64";
        } else if (process.arch === "x32") {
            platformArch = "x86";
        } else {
            return false;
        }

        let resultURL;
        if (javaVersion == 8) {
            resultURL =
                "https://api.adoptium.net/v3/binary/version/jdk8u312-b07/" +
                platformName +
                "/" +
                platformArch +
                "/jdk/hotspot/normal/eclipse?project=jdk";
        } else {
            resultURL =
                "https://api.adoptium.net/v3/binary/latest/" +
                javaVersion +
                "/ga/" +
                platformName +
                "/" +
                platformArch +
                "/jdk/hotspot/normal/eclipse?project=jdk";
        }

        let filename = "Java-" + javaVersion + "-" + platformArch + fileExtension;
        return {
            url: resultURL,
            filename: filename,
            version: javaVersion,
            platformArch: platformArch,
            platformName: platformName,
            downloadPath: path.join(javaInstallationDirectory, filename),
            unpackPath: path.join(javaInstallationDirectory, javaVersion) + path.sep
        }
    };

    // Получить список доступных на сервере версий Java
    static getDownloadableVersions = (cb) => {
        $.get(global.JAVA_LIST_URL, (data) => {
            if (data !== false) {
                let availReleases = data.available_releases;
                availReleases.forEach((release, i) => {
                    availReleases[i] = release.toString();
                });
                cb(availReleases);
                return;
            }
            cb(false);
        });
    };

    // Получить путь к скачанной версии Java (возвращает false, если версия не существует)
    static getPath = (javaVersion) => {
        let javaDirPath = path.join(javaInstallationDirectory, javaVersion);
        let javaSearchPath1 = path.join(javaDirPath, "bin", "java");
        if (process.platform === "win32") {
            javaSearchPath1 += ".exe";
        }
        if (fs.existsSync(javaDirPath) && fs.lstatSync(javaDirPath).isDirectory()) {
            if (fs.existsSync(javaSearchPath1)) {
                return javaSearchPath1;
            } else {
                let javaReaddir = fs.readdirSync(javaDirPath);
                if (fs.readdirSync(javaDirPath).length === 1) {
                    let javaChkPath = path.join(javaDirPath, javaReaddir[0], "bin", "java");
                    if (process.platform === "win32") {
                        javaChkPath += ".exe";
                    }
                    if (fs.existsSync(javaChkPath)) {
                        return javaChkPath;
                    }
                }
            }
        }
        return false;
    }

    // Версия игры -> версия Java
    static gameVersionToJavaVersion = (version) => {
        return new Promise(resolve => {
            FrogVersionsManager.getVersionManifest(version).then(manifest => {
                if (manifest !== false) {
                    if ((manifest.id.split(".")[1] <= 6 || manifest.id.match(/-rd/gim)) && typeof manifest.javaVersion === "undefined") {
                        resolve(8);
                    } else {
                        resolve(manifest.javaVersion.majorVersion);
                    }
                } else {
                    resolve(false);
                }
            })
        });
    }
}