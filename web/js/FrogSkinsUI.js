class FrogSkinsUI {
    // Перейти к регистрации
    static goRegister() {
        FrogModals.hideModal("frogLogin").then(() => {
            FrogModals.showModal("frogRegister");
        })
    }

    // Перейти к авторизации
    static goLogin() {
        FrogModals.hideModal("frogRegister").then(() => {
            FrogModals.showModal("frogLogin");
        })
    }

    // Начать процесс регистрации
    static register = () => {
        let login = $("#modal-frogRegister input.login").val();
        let password = $("#modal-frogRegister input.password").val();
        let repPassword = $("#modal-frogRegister input.password-repeat").val();

        let $error = $("#modal-frogRegister .error");

        if (login !== "" && password !== "" && password === repPassword) {
            $("#modal-frogRegister .loginBtn").hide();
            $error.hide();

            $.get(`${global.SKINS_API_URL}/register?username=${login}&password=${password}`, (result) => {
                if (result.success) {
                    $("#modal-frogRegister input.login").val("");
                    $("#modal-frogRegister input.password").val("");
                    $("#modal-frogRegister input.password-repeat").val("");
                    FrogModals.hideModal("frogRegister");
                    FrogAlerts.create(MESSAGES.frogAuth.register.success.title,
                        MESSAGES.frogAuth.register.success.description,
                        MESSAGES.frogAuth.register.success.button,
                        "how_to_reg", () => {
                            FrogSkinsUI.goLogin()
                        });
                }
            }).fail((e) => {
                console.log(e);
                $("#modal-frogRegister .loginBtn").show();
                $error.show();
                let response = e.responseJSON || e.responseText;

                if (typeof response.success !== "undefined" && response.success === false) {
                    let errorMessage = response.error || e.responseJSON.errorMessage;
                    if (typeof MESSAGES.frogAuth.errors[errorMessage] !== "undefined") {
                        return $error.text(MESSAGES.frogAuth.errors[errorMessage]);
                    }
                    return $error.text(MESSAGES.frogAuth.errors.UNKNOWN + ": " + errorMessage);
                }
                $error.text(MESSAGES.frogAuth.errors.UNKNOWN + ": " + e.responseText);
            })
        } else {
            $error.show();
            $error.text("Поля не заполнены");
        }
    }

    // Начать процесс входа
    static login = () => {
        let login = $("#modal-frogLogin input.login").val();
        let password = $("#modal-frogLogin input.password").val();
        let $error = $("#modal-frogLogin .error");

        if (login !== "" && password !== "") {
            $("#modal-frogLogin .loginBtn").hide();
            $error.hide();

            $.get(`${global.SKINS_API_URL}/login?username=${login}&password=${password}`, (result) => {
                if (result.success) {
                    $("#modal-frogLogin input.login").val("");
                    $("#modal-frogLogin input.password").val("");
                    $("#modal-frogLogin input.password-repeat").val("");

                    // Создаём аккаунт
                    let accountData = {
                        type: "frog",
                        nickname: result.username,
                        added: Date.now(),
                        clientToken: result.profileId,
                        accessToken: result.profileUuid,
                        uuid: result.profileUuid,
                        secret: result.secret,
                        textures: result.textures
                    }

                    let accountsList = FrogAccountsManager.getAccounts();
                    accountsList[result.profileUuid] = accountData;
                    FrogAccountsManager.saveAccounts(accountsList);

                    $("#modal-frogLogin input").val("");
                    FrogModals.hideModal("frogLogin").then(() => {
                        FrogToasts.create(result.username, "person", MESSAGES.commons.newAccountAdded);
                    });
                    return true;
                }
            }).fail((e) => {
                console.log(e);
                $("#modal-frogLogin .loginBtn").show();
                $error.show();
                let response = e.responseJSON || e.responseText;

                if (typeof response.success !== "undefined" && response.success === false) {
                    let errorMessage = response.error || e.responseJSON.errorMessage;
                    if (typeof MESSAGES.frogAuth.errors[errorMessage] !== "undefined") {
                        return $error.text(MESSAGES.frogAuth.errors[errorMessage]);
                    }
                    return $error.text(MESSAGES.frogAuth.errors.UNKNOWN + ": " + errorMessage);
                }
                $error.text(MESSAGES.frogAuth.errors.UNKNOWN + ": " + e.responseText);
            })
        } else {
            $error.show();
            $error.text("Поля не заполнены");
        }
    }

    // Обновить профили у всех аккаунтов
    static refreshAllProfiles = () => {
        let accountsList = FrogAccountsManager.getAccounts();
        let keysEachList = Object.keys(accountsList);
        let currentAccount = -1;
        let promiseResolve;
        return new Promise((resolve) => {
            promiseResolve = resolve;
            refreshNext();
        });

        function refreshNext() {
            currentAccount++;
            let accItem = accountsList[keysEachList[currentAccount]];
            if (typeof accItem !== "undefined") {
                if(accItem.type === "frog"){
                    $.get(`${global.SKINS_API_URL}/profile?secret=${accItem.secret}`, (result) => {
                        if (result.success === true) {
                            accountsList[keysEachList[currentAccount]].textures = result.textures;
                            accountsList[keysEachList[currentAccount]].nickname = result.username;
                        }
                        refreshNext();
                    });
                } else {
                    refreshNext();
                }
            } else {
                FrogAccountsManager.saveAccounts(accountsList);
                return promiseResolve();
            }
        }
    }

    // Обновить UI для работы со скинами/плащами
    static refreshSkinUI = (accountUuid) => {
        let accountData = FrogAccountsManager.getAccount(accountUuid);
        global.currentAccountInEditor = accountData;
        $("#modal-frogSkin .error").hide();
        let $skinDragzone = $("#modal-frogSkin .skindiv .dragzone");
        let $capeDragzone = $("#modal-frogSkin .capediv .dragzone");

        if(accountData.textures.skin !== false){
            $skinDragzone.find("img").show();
            $skinDragzone.find("img").attr("src", accountData.textures.skin);
            $skinDragzone.find("h4").hide();
        } else {
            $skinDragzone.find("h4").show();
            $skinDragzone.find("img").hide();
        }

        if(accountData.textures.cape !== false){
            $capeDragzone.find("img").show();
            $capeDragzone.find("img").attr("src", accountData.textures.cape);
            $capeDragzone.find("h4").hide();
        } else {
            $capeDragzone.find("h4").show();
            $capeDragzone.find("img").hide();
        }
    }
}