let downloadsProcesses = {};

class FrogDownloader {
    // Подготовить UI к отображению загрузки файла
    static prepareUIToDownload(displayName) {
        return new Promise(resolve => {
            FrogFlyout.setProgress(0);
            FrogFlyout.setText(`${MESSAGES.commons.downloading} ${displayName}`, MESSAGES.commons.plsWait);
            FrogFlyout.changeMode("progress").then(resolve);
        })
    }

    // Скачивается ли что-то в данный момент
    static isAnythingDownloading = () => {
        return Object.keys(downloadsProcesses).length;
    }

    // Обновить UI загрузки
    static updateDownloadUI = (displayName, progress, current, total) => {
        let currentHuman = FrogUtils.humanFileSize(current);
        let totalHuman = FrogUtils.humanFileSize(total);

        FrogFlyout.setProgress(progress);
        FrogFlyout.setText(`${MESSAGES.commons.downloading} ${displayName}`, `${currentHuman} / ${totalHuman} (${progress}%)`);
        return true;
    }

    // Обновить UI загрузки (использовать текст)
    static updateDownloadUIText = (displayName, progress, current, total) => {
        FrogFlyout.setProgress(progress);
        FrogFlyout.setText(`${MESSAGES.commons.downloading} ${displayName}`, `${current} / ${total} (${progress}%)`);
        return true;
    }

    // Скачать файл
    static downloadFile = (url, filePath, displayName = null, updateProgress = true) => {
        FrogCollector.writeLog(`New download [url=${url}] [displayName=${displayName}]`);
        if (displayName === null) {
            displayName = path.basename(filePath);
        }
        let dirname = path.dirname(filePath);
        if (!fs.existsSync(dirname)) {
            fs.mkdirSync(dirname, {
                recursive: true,
            });
        }

        let received_bytes = 0;
        let total_bytes = 0;
        let percent = "";

        return new Promise((resolve, reject) => {
            FrogDownloader.prepareUIToDownload(displayName).then(() => {
                FrogCollector.writeLog(`UI prepared for download`);
                request
                    .get(url)
                    .on("error", function (error) {
                        reject(error);
                    })
                    .on("response", function (data) {
                        total_bytes = parseInt(data.headers["content-length"]);
                        data.pipe(fs.createWriteStream(filePath));
                    })
                    .on("data", function (chunk) {
                        received_bytes += chunk.length;
                        if (updateProgress) {
                            percent = Math.round((received_bytes * 100) / total_bytes);
                            FrogDownloader.updateDownloadUI(displayName, percent, received_bytes, total_bytes);
                        }
                    })
                    .on("end", function () {
                        FrogCollector.writeLog(`Download completed [displayname=${displayName}]`);
                        FrogFlyout.setProgress(0);
                        resolve(true);
                    });
            })
        });
    }

    // Скачать файл в фоновом режиме
    static quietDownloadFile = (url, filePath) => {
        FrogCollector.writeLog(`New quiet download [url=${url}]`);
        let dirname = path.dirname(filePath);
        if (!fs.existsSync(dirname)) {
            fs.mkdirSync(dirname, {
                recursive: true,
            });
        }

        let received_bytes = 0;
        let total_bytes = 0;

        return new Promise((resolve, reject) => {
            request
                .get(url)
                .on("error", function (error) {
                    reject(error);
                })
                .on("response", function (data) {
                    total_bytes = parseInt(data.headers["content-length"]);
                    data.pipe(fs.createWriteStream(filePath));
                })
                .on("data", function (chunk) {
                    received_bytes += chunk.length;
                })
                .on("end", function () {
                    FrogCollector.writeLog(`Quiet download completed`);
                    resolve(true);
                });
        })
    }
}