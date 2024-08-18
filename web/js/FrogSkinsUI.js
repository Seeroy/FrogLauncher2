let skinViewer;

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
        let login = $("#modal-frogRegister input.login").val().trim();
        let password = $("#modal-frogRegister input.password").val().trim();
        let repPassword = $("#modal-frogRegister input.password-repeat").val().trim();

        let $error = $("#modal-frogRegister .error");

        if (login !== "" && password !== "" && password === repPassword && login.match(NICKNAME_REGEX) !== null) {
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
        let login = $("#modal-frogLogin input.login").val().trim();
        let password = $("#modal-frogLogin input.password").val().trim();
        let $error = $("#modal-frogLogin .error");

        if (login !== "" && password !== "" && login.match(NICKNAME_REGEX) !== null) {
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
                        accessToken: result.clientId,
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
                if (accItem.type === "frog") {
                    $.get(`${global.SKINS_API_URL}/profile?secret=${accItem.secret}`, (result) => {
                        if (result.success === true) {
                            accountsList[keysEachList[currentAccount]].textures = result.textures;
                            accountsList[keysEachList[currentAccount]].nickname = result.username;
                        }
                        refreshNext();
                    }).fail(function (e) {
                        console.log(e);
                        refreshNext();
                    });
                } else if (accItem.type === "elyby") {
                    FrogElybyManager.getHeadURLByPlayerNickname(accountsList[keysEachList[currentAccount]].nickname).then(refreshNext);
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

        setTimeout(() => {
            renderSkinInUI((accountData.textures.skin || ""), (accountData.textures.cape || ""));
        }, 250);
    }

    // Очистить кэш скинов
    static clearSkinsCache = () => {
        let cachePath = `${global.GAME_DATA}/assets/skins`;
        if (!fs.existsSync(cachePath)) {
            return true;
        }

        fs.rmSync(cachePath, {recursive: true, force: true});
        if (!fs.existsSync(cachePath)) {
            fs.mkdirSync(cachePath);
        }
        return true;
    }

    // Загрузить текстуру на сервер
    static uploadTexture = (type, file = "") => {
        let $error = $("#modal-frogSkin .error");
        let formData;
        if (file === "") {
            formData = new FormData($("#texture-image-form")[0]);
        } else {
            formData = new FormData();
            formData.append('texture-image', file);
        }
        $.ajax({
            url: `${global.SKINS_API_URL}/${type}/upload?secret=${currentAccountInEditor.secret}`,
            type: "POST",
            data: formData,
            success: function (response) {
                FrogSkinsUI.refreshSkinUI(currentAccountInEditor.uuid);
                FrogSkinsUI.refreshAllProfiles();
                FrogAccountsUI.reloadAccountSelect();
            },
            error: function (e) {
                console.log(e);
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
            },
            processData: false,
            contentType: false
        });
    }
}

function renderSkinInUI(skinPath = "", capePath = "") {
    let $canvas = document.getElementById("skin_container");
    if (skinPath === "" && capePath === "") {
        return false;
    }

    if (skinPath !== "") {
        let canvasSizes = $canvas.getBoundingClientRect();
        skinViewer = new skinview3d.SkinViewer({
            canvas: $canvas,
            width: Math.round(canvasSizes.width),
            height: Math.round(canvasSizes.height)
        });
        skinViewer.autoRotate = true;
        skinViewer.loadSkin(path.normalize(skinPath));
        skinViewer.animation = new skinview3d.WalkingAnimation();
    }

    if (capePath !== "") {
        skinViewer.loadCape(path.normalize(capePath));
    }
    return true;
}