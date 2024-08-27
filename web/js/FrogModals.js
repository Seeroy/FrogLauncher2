class FrogModals {
    // Показать модальное окно
    static showModal = async (modalName) => {
        FrogCollector.writeLog(`Modal: Show "${modalName}"`);

        document.dispatchEvent(new CustomEvent("showModalEvent", {
            detail: {modal: modalName}
        }));
        if (FrogModals.isModalShown(modalName)) {
            return false;
        }
        let modalElem = $(`.modal#modal-${modalName}`);
        modalElem.show();
        if (modalElem[0].tagName === "DIALOG") {
            modalElem[0].showModal();
        }
        await animateCSSNode(modalElem[0], "fadeInUp");
        return true;
    }

    // Скрыть модальное окно
    static hideModal = async (modalName) => {
        FrogCollector.writeLog(`Modal: Hide "${modalName}"`);

        document.dispatchEvent(new CustomEvent("hideModalEvent", {
            detail: {modal: modalName}
        }));
        if (!FrogModals.isModalShown(modalName)) {
            return false;
        }
        let modalElem = $(`.modal#modal-${modalName}`);
        await animateCSSNode(modalElem[0], "fadeOutDown");
        modalElem.hide();
        if (modalElem[0].tagName === "DIALOG") {
            modalElem[0].close();
        }
        return true;
    }

    // Переключить окно (если сейчас показано какое-либо)
    static switchModal = async (modalName) => {
        FrogFlyout.lockFlymenu();
        $(`.flymenu .item[data-modal="${FrogModals.currentModalName()}"]`).removeClass("active");
        $(`.flymenu .item[data-modal="${modalName}"]`).addClass("active");
        await FrogModals.hideCurrentModal();
        await FrogModals.showModal(modalName);
        FrogFlyout.unlockFlymenu();
        return true;
    }

    // Скрыть модальное окно, которое сейчас открыто
    static hideCurrentModal = async () => {
        let currentModalElement = $(`.modal[style!="display: none;"]:not(.overlay)`);
        let currentModalName = $(currentModalElement).attr("id").replace("modal-", "");
        await FrogModals.hideModal(currentModalName);
        return true;
    }

    // Скрыть модальное overlay окно, которое сейчас открыто
    static hideCurrentOverlay = async () => {
        let currentModalElement = $(`.modal.overlay[style!="display: none;"]`);
        if (currentModalElement.length === 0) return false;
        let currentModalName = $(currentModalElement).attr("id").replace("modal-", "");
        await FrogModals.hideModal(currentModalName);
        return true;
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

    // Показано ли overlay модальное окно (если "", то любое из окон)
    static isOverlayModalShown = (modalName = "") => {
        if (modalName !== "") {
            return FrogModals.isModalShown(modalName);
        } else {
            return $(`.modal.overlay[style!="display: none;"]`).length > 0;
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