let javaInstallationDirectory;

class FrogJavaManager {
    // Установить версию Java
    static install = async (version, restoreStartMode = false) => {
        if (FrogJavaManager.isInstalled(version)) {
            return true;
        }
        // Готовим UI
        FrogFlyout.setUIStartMode(true);
        FrogFlyout.setText();
        FrogFlyout.setProgress(-1);
        await FrogFlyout.changeMode("spinner");
        // Получаем информацию
        let info = FrogJavaManager.getByVersion(version);
        // Скачиваем
        await FrogDownloader.downloadFile(info.url, info.downloadPath, `Java ${version}`);
        // Меняем UI
        await FrogFlyout.changeMode("spinner");
        FrogFlyout.setText(`${MESSAGES.java.unpacking} ${version}`);
        // Распаковываем
        await FrogUtils.unpackArchive(info.downloadPath, info.unpackPath);
        // Удаляем temp файлы
        fs.unlinkSync(info.downloadPath);
        if (restoreStartMode) {
            FrogFlyout.setUIStartMode(false);
            FrogFlyout.changeMode("idle");
        }
        FrogToasts.create(`Java ${version}`, "info", MESSAGES.java.installed);
        return true;
    }

    // Инициализация директории
    static init = () => {
        javaInstallationDirectory = path.join(GAME_DATA, "javaDownloads");
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
    static getDownloadableVersions = async () => {
        let [isSuccess, data] = await FrogRequests.get(JAVA_LIST_URL);
        if (isSuccess && data) {
            let availReleases = data.available_releases;
            availReleases.forEach((release, i) => {
                availReleases[i] = release.toString();
            });
            return availReleases;
        }
        return false;
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
    static gameVersionToJavaVersion = async (version) => {
        let manifest = await FrogVersionsManager.getVersionManifest(version);
        if (manifest !== false) {
            if ((manifest.id.split(".")[1] <= 6 || manifest.id.match(/-rd/gim)) && typeof manifest.javaVersion === "undefined") {
                return "8";
            } else {
                return manifest.javaVersion.majorVersion.toString();
            }
        } else {
            return false;
        }
    }
}