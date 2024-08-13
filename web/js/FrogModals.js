class FrogModals {
    // Показать модальное окно
    static showModal = (modalName) => {
        FrogCollector.writeLog(`Modal: Show "${modalName}"`);

        document.dispatchEvent(new CustomEvent("showModalEvent", {
            detail: {modal: modalName}
        }));
        return new Promise((resolve) => {
            if (!FrogModals.isModalShown(modalName)) {
                let modalElem = $(`.modal#modal-${modalName}`);
                modalElem.show();
                if (modalElem[0].tagName === "DIALOG") {
                    modalElem[0].showModal();
                }
                animateCSSNode(modalElem[0], "fadeInUp").then(() => {
                    resolve(true);
                });
            } else {
                resolve(false);
            }
        })
    }

    // Скрыть модальное окно
    static hideModal = (modalName) => {
        FrogCollector.writeLog(`Modal: Hide "${modalName}"`);

        document.dispatchEvent(new CustomEvent("hideModalEvent", {
            detail: {modal: modalName}
        }));
        return new Promise((resolve) => {
            if (FrogModals.isModalShown(modalName)) {
                let modalElem = $(`.modal#modal-${modalName}`);
                animateCSSNode(modalElem[0], "fadeOutDown").then(() => {
                    modalElem.hide();
                    if (modalElem[0].tagName === "DIALOG") {
                        modalElem[0].close();
                    }
                    resolve(true);
                });
            } else {
                resolve(false);
            }
        })
    }

    // Переключить окно (если сейчас показано какое-либо)
    static switchModal = (modalName) => {
        FrogFlyout.lockFlymenu();
        $(`.flymenu .item[data-modal="${FrogModals.currentModalName()}"]`).removeClass("active");
        $(`.flymenu .item[data-modal="${modalName}"]`).addClass("active");
        return new Promise((resolve) => {
            FrogModals.hideCurrentModal().then(() => {
                FrogModals.showModal(modalName).then(() => {
                    FrogFlyout.unlockFlymenu();
                    return resolve();
                });
            })
        });
    }

    // Скрыть модальное окно, которое сейчас открыто
    static hideCurrentModal = () => {
        return new Promise((resolve) => {
            let currentModalElement = $(`.modal[style!="display: none;"]:not(.overlay)`);
            let currentModalName = $(currentModalElement).attr("id").replace("modal-", "");
            FrogModals.hideModal(currentModalName).then(resolve);
        })
    }

    // Получить название modal на переднем плане
    static currentModalName = () => {
        let $currentModal = $(`.modal[style!="display: none;"]:not(.overlay)`);
        return $currentModal[0].id.replace("modal-", "");
    }

    // Показано ли модальное окно (если "", то любое из окон)
    static isModalShown = (modalName = "") => {
        if (modalName !== "") {
            return $(`.modal#modal-${modalName}`).css("display") !== "none";
        } else {
            return $(`.modal[style!="display: none;"]:not(.overlay)`).length > 0;
        }
    }

    // Скрыть все и переключиться на контент
    static switchToContent = () => {
        $(".modal.overlay").each(function () {
            FrogModals.hideModal($(this)[0].id.replace("modal-", ""));
        })
        if ($(`.modal[style!="display: none;"]:not(.overlay)`)[0].id !== "modal-content") {
            FrogModals.switchModal("content");
        }
    }
}