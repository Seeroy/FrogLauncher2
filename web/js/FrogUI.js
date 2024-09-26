let isEggPlaying = false;

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

    // Перезагрузить главное окно (по сути - рестарт лаунчера)
    static reloadMainWindow = () => {
        FrogCollector.writeLog(`Reloading main window!`);
        ipcRenderer.send("reload-main-window");
    }

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

    // Сделать пасхалко
    static bindEasterEgg = () => {
        $("img").each(function () {
            let imgSrc = $(this)?.attr("src")?.toString() ?? "";
            if (imgSrc.match(/assets\/icon\.png/mig) !== null) {
                $(this).click(function () {
                    if (isEggPlaying === false) {
                        isEggPlaying = true;
                        $(this).addClass("animate__animated animate__tada");
                        $(this)[0].addEventListener(
                            "animationend",
                            () => {
                                $(this).removeClass(
                                    "animate__animated animate__tada"
                                );
                                isEggPlaying = false;
                                $('#audio').html('');
                            },
                            {
                                once: true,
                            }
                        );
                        let sound = new Howl({
                            src: ['assets/idle1.wav']
                        });
                        sound.play();
                    }
                })
            }
        });
    }

    // Диалог выбора мира и получить результат
    static selectWorld = async () => {
        // Загружаем миры в список
        let worlds = await FrogWorldsManager.getAllWorlds();
        worlds.forEach(world => {
            if (world.worlds.length > 0) {
                let subWorlds = "";
                world.worlds.forEach(item => {
                    subWorlds += `<div class='item sub' data-path="${item.path}">${item.name}</div>`;
                });
                let worldShortPath = world.path.replace(GAME_DATA + path.sep, "");
                $(".worlds-list").append(`<div class='item'>${worldShortPath}</div>${subWorlds}`);
            }
        })

        // Выбор активного
        $("#modal-selectWorld .worlds-list .item.sub").click(function () {
            if (!$(this).hasClass("active")) {
                $("#modal-selectWorld .worlds-list .item.active").removeClass("active");
                $(this).addClass("active");
            }
        })

        // Возвращаем результат
        $("#modal-selectWorld .select").one("click", function () {
            let $activeItem = $("#modal-selectWorld .worlds-list .item.active");
            if ($activeItem.length === 1) {
                FrogModals.hideModal("selectWorld");
                return $activeItem.data("path");
            }
        })

        // Отмена выбора
        $("#modal-selectWorld .square").one("click", function () {
            return false;
        })

        await FrogModals.showModal("selectWorld");
    }

    // Получить список доступных шрифтов
    static getFontsAvailable = async () => {
        let stockFontsList = ["Manrope", "Fira Code"];
        // Если есть такая функция
        if ("queryLocalFonts" in window) {
            try {
                // Получаем список шрифтов
                let fonts = await window.queryLocalFonts();
                let fontsList = stockFontsList;
                fonts.forEach(font  => {
                    fontsList.push(font.family);
                })
                return [...new Set(fontsList)];
            } catch {
                return stockFontsList;
            }
        } else {
            return stockFontsList;
        }
    }
}