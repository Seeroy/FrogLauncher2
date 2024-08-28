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
    static register = async () => {
        let login = $("#modal-frogRegister input.login").val().trim();
        let password = $("#modal-frogRegister input.password").val().trim();
        let repPassword = $("#modal-frogRegister input.password-repeat").val().trim();
        let $error = $("#modal-frogRegister .error");

        if (login === "" || password === "" || login.match(NICKNAME_REGEX) === null) {
            $error.show();
            $error.text(MESSAGES.frogAuth.fieldsError);
            return false;
        }

        if (password !== repPassword) {
            $error.show();
            $error.text(MESSAGES.frogAuth.passwordsComp);
            return false;
        }

        $("#modal-frogRegister .loginBtn").hide();
        $error.hide();

        let [isSuccess, response] = await FrogRequests.get(`${SKINS_API_URL}/register?username=${login}&password=${password}`);
        if (isSuccess && response.success) {
            $("#modal-frogRegister input.login").val("");
            $("#modal-frogRegister input.password").val("");
            $("#modal-frogRegister input.password-repeat").val("");
            FrogAlerts.create(MESSAGES.frogAuth.register.success.title,
                MESSAGES.frogAuth.register.success.description,
                MESSAGES.frogAuth.register.success.button,
                "how_to_reg", () => {
                    FrogSkinsUI.goLogin()
                });
            await FrogModals.hideModal("frogRegister");
            return true;
        }

        // Произошла ошибка
        console.log(response);
        $("#modal-frogRegister .loginBtn").show();
        FrogSkinsUI.parseAndShowError(response);
    }

    // Начать процесс входа
    static login = async () => {
        let login = $("#modal-frogLogin input.login").val().trim();
        let password = $("#modal-frogLogin input.password").val().trim();
        let $error = $("#modal-frogLogin .error");

        if (login === "" || password === "" || login.match(NICKNAME_REGEX) === null) {
            $error.show();
            $error.text(MESSAGES.frogAuth.fieldsError);
            return;
        }

        $("#modal-frogLogin .loginBtn").hide();
        $error.hide();

        let [isSuccess, response] = await FrogRequests.get(`${SKINS_API_URL}/login?username=${login}&password=${password}`);
        if (isSuccess && response.success) {
            $("#modal-frogLogin input.login").val("");
            $("#modal-frogLogin input.password").val("");
            $("#modal-frogLogin input.password-repeat").val("");

            // Создаём аккаунт
            let accountData = {
                type: "frog",
                nickname: response.username,
                added: Date.now(),
                clientToken: response.profileId,
                accessToken: response.clientId,
                uuid: response.profileUuid,
                secret: response.secret,
                textures: response.textures
            }

            let accountsList = FrogAccountsManager.getAccounts();
            accountsList[response.profileUuid] = accountData;
            await FrogAccountsManager.saveAccounts(accountsList);

            $("#modal-frogLogin input").val("");
            FrogToasts.create(response.username, "person", MESSAGES.commons.newAccountAdded);
            await FrogModals.hideModal("frogLogin");
            return true;
        }

        // Произошла ошибка
        console.log(response);
        $("#modal-frogLogin .loginBtn").show();
        FrogSkinsUI.parseAndShowError(response);
    }

    // Парсить и показать в UI ошибку
    static parseAndShowError = (response) => {
        let $error = $("#modal-frogLogin .error");
        let errData = response.responseJSON || response.responseText;
        $error.show();

        if (typeof errData.success !== "undefined" && errData.success === false) {
            let errorMessage = errData.error || errData.errorMessage;
            if (typeof MESSAGES.frogAuth.errors[errorMessage] !== "undefined") {
                return $error.text(MESSAGES.frogAuth.errors[errorMessage]);
            }
            $error.text(MESSAGES.frogAuth.errors.UNKNOWN + ": " + errorMessage);
            return false;
        }
        $error.text(MESSAGES.frogAuth.errors.UNKNOWN + ": " + errData.toString());
        return false;
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
                    FrogRequests.get(`${SKINS_API_URL}/profile?secret=${accItem.secret}`).then(result => {
                        let [isSuccess, response] = result;
                        if(!isSuccess || !response.success){
                            console.log(response);
                            return refreshNext();
                        }
                        accountsList[keysEachList[currentAccount]].textures = response.textures;
                        accountsList[keysEachList[currentAccount]].nickname = response.username;
                        return refreshNext();
                    })
                } else if (accItem.type === "elyby") {
                    FrogElybyManager.getHeadURLByPlayerNickname(accountsList[keysEachList[currentAccount]].nickname).then(refreshNext);
                } else {
                    refreshNext();
                }
            } else {
                FrogAccountsManager.saveAccounts(accountsList).then(() => {
                    return promiseResolve(true);
                });
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
        let cachePath = `${GAME_DATA}/assets/skins`;
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
    static uploadTexture = async (type, file = "") => {
        let formData;
        if (file === "") {
            formData = new FormData($("#texture-image-form")[0]);
        } else {
            formData = new FormData();
            formData.append('texture-image', file);
        }
        let [isSuccess, response] = await FrogRequests.post(`${SKINS_API_URL}/${type}/upload?secret=${currentAccountInEditor.secret}`, formData);
        if(!isSuccess){
            console.log(response);
            return FrogSkinsUI.parseAndShowError(response);
        }
        FrogSkinsUI.refreshSkinUI(currentAccountInEditor.uuid);
        FrogAccountsUI.reloadAccountSelect();
        await FrogSkinsUI.refreshAllProfiles();
        return true;
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
        skinViewer.autoRotate = true;
    }

    if (capePath !== "") {
        skinViewer.loadCape(path.normalize(capePath));
    }
    return true;
}