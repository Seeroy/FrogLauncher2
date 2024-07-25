let notifyElem = $(".update-notify");
let notifyElemBtn = notifyElem.children("button");
let notifyElemText = notifyElem.children(".description");

class FrogUpdater {
    // Забиндить эвенты обновлений
    static bindUpdate = () => {
        ipcRenderer.once("update-available", () => {
            FrogUpdater.onUpdateAvailable();
        });
        ipcRenderer.once("update-downloaded", () => {
            FrogUpdater.onUpdateDownloaded();
        });
    }

    // При нахождении обновления - показать уведомление
    static onUpdateAvailable = () => {
        FrogCollector.writeLog(`Updater: New version found`);
        notifyElem.show();
        notifyElem.addClass("animate__animated animate__fadeInDown");
        notifyElemBtn.hide();
        notifyElemText.text("Идёт скачивание");
        setTimeout(() => {
            notifyElem.removeClass("animate__animated animate__fadeInDown");
        }, 1000);
    }

    // После скачивания обновления - изменить уведомление
    static onUpdateDownloaded = () => {
        FrogCollector.writeLog(`Updater: New version downloaded, ready to restart`);
        notifyElemBtn.show();
        notifyElemText.text("После перезапуска лаунчера обновление будет установлено");
    }

    // Установить обновление
    static installUpdate = () => {
        ipcRenderer.send("install-update");
    }
}