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
            if (acc.type === "elyby") {
                imageUrl = path.join(global.USERDATA_PATH, "elybySkins", `${acc.nickname}.png`);
            }
            let preparedPlaceholder = placeholder.replaceAll("$1", acc.nickname).replaceAll("$2", accountType).replaceAll("$3", acc.uuid).replaceAll("$4", imageUrl).replaceAll("$5", acc.type);
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
        let activeAccount = FrogAccountsManager.getActiveAccount();
        if (activeAccount === "none") {
            $("#accountSelect .title").text("Не выбран");
            $("#accountSelect .icon").hide();
        } else {
            let accountData = FrogAccountsManager.getAccount(activeAccount);
            $("#accountSelect .title").text(accountData.nickname);
            $("#accountSelect .icon").show();
            if (accountData.type !== "elyby") {
                $("#accountSelect .icon").attr("src", `https://minotar.net/avatar/${accountData.nickname}/40`);
            } else {
                FrogElybyManager.getHeadURLByPlayerNickname(accountData.nickname).then(url => {
                    $("#accountSelect .icon").attr("src", url.replaceAll("\\", "/"));
                });
            }
        }
        return true;
    }

    // Получить текст из типа аккаунта
    static typeDisplayName = (type) => {
        switch (type) {
            case "local":
                return "Локальный аккаунт";
            case "microsoft":
                return "Аккаунт Microsoft";
            case "elyby":
                return "Аккаунт Ely.by";
            default:
                return "Неизвестный тип";
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
        FrogFlyout.setText("Добавление аккаунта Microsoft", "Следуйте инструкции на экране");
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