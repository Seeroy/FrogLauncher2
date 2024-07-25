class FrogUI {
    // Скрыть главное окно
    static disappearMainWindow() {
        FrogCollector.writeLog(`IPC: Disappear main window`);
        ipcRenderer.send("disappear-main-window");
    };

    // Показать главное окно
    static appearMainWindow() {
        FrogCollector.writeLog(`IPC: Appear main window`);
        ipcRenderer.send("appear-main-window");
    };

    // Свернуть главное окно
    static minimizeMainWindow = () => {
        FrogCollector.writeLog(`IPC: Hide main window`);
        ipcRenderer.send("hide-main-window");
    };

    // Развернуть на весь экран главное окно
    static maximizeMainWindow = () => {
        FrogCollector.writeLog(`IPC: Maximize main window`);
        ipcRenderer.send("maximize-main-window");
    };

    // Закрыть главное окно -> закрыть лаунчер
    static closeMainWindow = () => {
        FrogCollector.writeLog(`IPC: Close`);
        FrogCollector.writeLog(`Bye bye!`);
        ipcRenderer.send("close-main-window");
    };

    // Начать загрузочную анимацию
    static startLoadScreenAnimation = () => {
        let loadingScreenElem = $(".loading-screen");
        loadingScreenElem.addClass("animateIn");
        setTimeout(() => {
            let introSound = new Howl({
                src: 'assets/sounds/start.mp3',
                volume: 0.2
            });
            introSound.play();
            $(".loading-screen img").addClass("uncircle");
        }, 200);
        setTimeout(() => {
            let sweepSound = new Howl({
                src: 'assets/sounds/sweep.mp3',
                volume: 0.1
            });
            sweepSound.play();
        }, 900);
        setTimeout(() => {
            loadingScreenElem.removeClass("animateIn");
            loadingScreenElem.addClass("animateOut");
            setTimeout(() => {
                $(".loading-screen").hide();
                $(".hide-on-loading").removeClass("hide-on-loading");
                $("body *")[0].getAnimations().forEach((anim) => {
                    anim.cancel();
                    anim.play();
                });
            }, 950);
        }, 1200);
    }

    // Показать консоль
    static showConsole = () => {
        return ipcRenderer.send("open-console-window");
    }
}