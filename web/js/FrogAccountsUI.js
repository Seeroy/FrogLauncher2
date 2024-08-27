class FrogAccountsUI {
    // Перезагрузить список доступных аккаунтов
    static reloadAccountsManager = () => {
        $("#modal-accounts .accounts-list .item").unbind("click");
        // Получаем список и активный аккаунт
        let accountsList = FrogAccountsManager.getAccounts();
        let activeAccount = FrogAccountsManager.getActiveAccount();
        $("#modal-accounts .accounts-list .item:not(.placeholder)").remove();

        // Получаем код placeholder`а
        let placeholder = $("#modal-accounts .accounts-list .item.placeholder")[0].outerHTML;
        placeholder = placeholder.replace(' placeholder', "");
        // По placeholder`у добавляем новые элементы
        Object.values(accountsList).forEach((acc) => {
            let accountType = FrogAccountsUI.typeDisplayName(acc.type);
            let imageUrl = `https://minotar.net/avatar/${acc.nickname}/44`;
            let editButtonVisible = "none";
            if (acc.type === "elyby") {
                imageUrl = path.join(USERDATA_PATH, "elybySkins", `${acc.nickname}.png`);
            }
            if (acc.type === "frog") {
                imageUrl = acc.textures.head || imageUrl;
                editButtonVisible = "inherit";
            }
            let preparedPlaceholder = placeholder.replaceAll("$1", acc.nickname).replaceAll("$2", accountType).replaceAll("$3", acc.uuid).replaceAll("$4", imageUrl).replaceAll("$5", acc.type).replaceAll("$6", editButtonVisible);
            $("#modal-accounts .accounts-list").append(preparedPlaceholder);
        })

        // Помечаем нужные аккаунты в списке активными
        $("#modal-accounts .accounts-list .item").each(function () {
            if (!$(this).hasClass("placeholder")) {
                if ($(this).data("uuid") === activeAccount) {
                    $(this).addClass("active");
                }
                if ($(this).data("type") === "microsoft") {
                    $(this).find(".type.microsoft").show();
                }
                if ($(this).data("type") === "elyby") {
                    $(this).find(".type.elyby").show();
                }
                if ($(this).data("type") === "frog") {
                    $(this).find(".type.frog").show();
                }
                $(this).show();
            }
        })

        // Биндим клик на смену аккаунта
        $("#modal-accounts .accounts-list .item, #modal-accounts .accounts-list .item *:not(.delete)").click(function () {
            FrogAccountsManager.setActiveAccount($(this).data("uuid"));
            FrogModals.hideModal("accounts");
        })
        return true;
    }

    // Перезагрузить кнопку для открытия менеджера аккаунтов
    static reloadAccountSelect = () => {
        $(".flyout #accountSelectPlaceholder").show();
        $(".flyout #accountSelect").hide();
        let activeAccount = FrogAccountsManager.getActiveAccount();
        let $activeAccount = $("#modal-accounts .accounts-list .item.active");

        if (activeAccount === "none") {
            $("#accountSelect .title").text(MESSAGES.commons.notSelected);
            $("#accountSelect .icon").hide();
            $("#accountSelect .description").hide();
        } else {
            $("#accountSelect")[0].innerHTML = "";
            $("#accountSelect")[0].innerHTML = $activeAccount.html();
            $("#accountSelect .check, #accountSelect .buttons").remove();
        }
        $(".flyout #accountSelectPlaceholder").hide();
        $(".flyout #accountSelect").show();
        return true;
    }

    // Получить текст из типа аккаунта
    static typeDisplayName = (type) => {
        if (typeof MESSAGES.accounts[type] !== "undefined") {
            return MESSAGES.accounts[type];
        } else {
            return MESSAGES.accounts.unknown;
        }
    }

    // Показать UI для добавления локального аккаунта
    static showAddLocalAccountUI = () => {
        $("#modal-accounts .add-local").show();
        $("#modal-accounts .add-local").removeClass("hidden");
    }

    // Добавить локальный аккаунт из UI
    static addLocalAccount = () => {
        let txt = $("#modal-accounts .add-local input").val().trim();
        FrogAccountsManager.addLocalAccount(txt);
        $("#modal-accounts .add-local").addClass("hidden");
        $("#modal-accounts .add-local").one("transitionend webkitTransitionEnd oTransitionEnd", () => {
            $("#modal-accounts .add-local").hide();
        })
        $("#modal-accounts .add-local input").val("");
    }

    // Добавить Microsoft аккаунт из UI
    static addMicrosoftAccount = () => {
        FrogModals.hideModal("accounts");
        FrogFlyout.setUIStartMode(true);
        FrogFlyout.setText(MESSAGES.accounts.addingMs);
        FrogFlyout.changeMode("spinner").then(() => {
            FrogAccountsManager.addMicrosoftAccount().then(() => {
                FrogFlyout.changeMode("idle");
                FrogFlyout.setUIStartMode(false);
            });
        })
    }

    // Открыть UI аккаунтов
    static open = () => {
        if (FrogModals.isModalShown("accounts")) {
            return FrogModals.hideModal("accounts");
        }
        return FrogModals.showModal("accounts");
    }
}