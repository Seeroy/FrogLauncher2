class FrogCollector {
    // Собрать архив отладки
    static collectDebugData = () => {
        FrogCollector.writeLog("Collecting debug archive");
        machineUuid().then((uniqueId) => {
            let archiveName = `FL_debug-${Date.now()}-${uniqueId}`;
            let archiveDirPath = path.join(USERDATA_PATH, archiveName);
            let filesList = [
                path.join(archiveDirPath, "last.log"),
                path.join(archiveDirPath, "timestamp"),
                path.join(archiveDirPath, "localStorage"),
                path.join(archiveDirPath, "data.json")
            ];
            fs.mkdirSync(archiveDirPath);
            fs.writeFileSync(filesList[0], LAST_LOG);
            fs.writeFileSync(filesList[1], Date.now().toString());
            fs.writeFileSync(filesList[2], JSON.stringify(window.localStorage));
            fs.writeFileSync(filesList[3], JSON.stringify({
                cpu: os.cpus()[0],
                ram: Math.round(os.totalmem() / 1024 / 1024),
                arch: os.arch(),
                win: os.release(),
                hostName: os.hostname(),
                homeDir: os.homedir(),
                appDataDir: USERDATA_PATH,
                resolvedRoot: path.resolve("./"),
                uniqueId: uniqueId,
                version: LAUNCHER_VERSION,
                processVersions: process.versions,
                javas: FrogJavaManager.getLocal(),
                packsCount: FrogPacks.getPacksList().length,
                settings: FrogConfig.readConfig()
            }));
            const outputPath = path.join(USERDATA_PATH, archiveName + ".zip");
            FrogUtils.compressDirectory(outputPath, archiveDirPath).then(() => {
                filesList.forEach(file => {
                    fs.unlinkSync(file);
                })
                fs.rmdirSync(archiveDirPath);
                openExternal(USERDATA_PATH);
            })
        });
    }

    static writeLog = (...data) => {
        let logDate = new Date().toISOString();
        let newPart = "\n" + "[" + logDate + "] " + data.join(" ")
        global.LAST_LOG = global.LAST_LOG + newPart;
        ipcRenderer.send("console-log", newPart);
        updateConsole();
    }

    static collectAndSendStats = async () => {
        FrogCollector.writeLog("Collecting stats");
        machineUuid().then((uniqueId) => {
            let platformInfo = {
                name: os.type(),
                release: os.release(),
                arch: process.arch,
                version: os.version(),
            };

            let cpuSummary = os.cpus();

            let cpuInfo = {
                model: cpuSummary[0].model,
                speed: cpuSummary[0].speed,
                cores: cpuSummary.length,
            };

            let collectedStats = {
                platform: platformInfo,
                totalRAM: Math.round(os.totalmem() / 1024 / 1024),
                cpu: cpuInfo,
                uniqueID: uniqueId,
                version: LAUNCHER_VERSION,
                javas: FrogJavaManager.getLocal(),
                packsCount: FrogPacks.getPacksList().length,
                versionsInstalledCount: FrogVersionsManager.getInstalledVersionsList().length,
                versions: process.versions
            };
            if (FrogConfig.read("lessDataCollection", false) === true) {
                // Меньше собираем данные
                collectedStats = {
                    uniqueID: uniqueId,
                    version: LAUNCHER_VERSION
                }
            }
            $.get(
                STATS_URL + encodeURIComponent(JSON.stringify(collectedStats)),
                () => {
                    FrogCollector.writeLog("Stats sent successfully");
                    return true;
                }
            );
        });
    }

    static setupLogHijacking = () => {
        // Добавляем хэндлинг ошибок
        window.onerror = (errorMsg, url, lineNumber) => {
            FrogCollector.writeLog("========================");
            FrogCollector.writeLog("window.onerror triggered at", Date.now());
            FrogCollector.writeLog("Message:", errorMsg);
            FrogCollector.writeLog("URL:", url);
            FrogCollector.writeLog("Line number:", lineNumber);
            FrogCollector.writeLog("========================");
        };

        window.addEventListener("error", function (e) {
            FrogCollector.writeLog("========================");
            FrogCollector.writeLog("error event triggered at", Date.now());
            FrogCollector.writeLog("Message:", e.error.message);
            FrogCollector.writeLog("Full JSON:", JSON.stringify(e));
            FrogCollector.writeLog("========================");
        });

        // Заменяем функции консоли
        let oldConsole = console;
        let newConsole = {};
        newConsole.log = function (...log) {
            oldConsole.log(...log);
            FrogCollector.writeLog("BROWSER:", ...log);
        };

        newConsole.info = function (...log) {
            oldConsole.info(...log);
            FrogCollector.writeLog("BROWSER:", ...log);
        };

        newConsole.warn = function (...log) {
            oldConsole.warn(...log);
            FrogCollector.writeLog("BROWSER:", ...log);
        };

        newConsole.error = function (...log) {
            oldConsole.error(...log);
            FrogCollector.writeLog("BROWSER:", ...log);
        };
        window.console = newConsole;
        return true;
    }
}