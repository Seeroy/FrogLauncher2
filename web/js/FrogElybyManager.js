const ELYBY_ENDPOINT = "https://authserver.ely.by";
const ELYBY_AUTH_URL = "/auth/authenticate";
const ELYBY_REFRESH_URL = "/auth/refresh";
const ELYBY_VALIDATE_URL = "/auth/validate";

class FrogElybyManager {
    // Войти в аккаунт (возвращает success, data/error)
    static loginAccount = async (login, password, totpToken = "") => {
        let clientToken = await machineUuid();
        if (totpToken !== "") {
            password = password + ":" + totpToken;
        }
        let [isSuccess, response] = await FrogRequests.post(ELYBY_ENDPOINT + ELYBY_AUTH_URL, {
            username: login,
            password: password,
            clientToken: clientToken,
            requestUser: true
        }, "json", true);
        if(isSuccess){
            return [true, response, clientToken];
        } else {
            if (response.responseJSON.errorMessage.match(/Invalid credentials/gim) !== null) {
                return [false, "INVALID_CREDENTIALS", clientToken];
            } else if (response.responseJSON.errorMessage.match(/two factor auth/gim) !== null) {
                return [false, "REQUIRES_TOTP", clientToken];
            } else {
                return [false, response.responseJSON.errorMessage, clientToken];
            }
        }
    }

    // Обновить access token
    static refreshAccessToken = async (authToken) => {
        let clientToken = await machineUuid();
        let [isSuccess, result] = await FrogRequests.post(ELYBY_ENDPOINT + ELYBY_REFRESH_URL, {
            accessToken: authToken,
            clientToken: clientToken,
            requestUser: true,
        }, "json", true);
        if(!isSuccess){
            return [false, result.toString(), clientToken];
        }
        return [true, result, clientToken];
    }

    // Валидировать access token
    static validateAccessToken = async (accessToken) => {
        $.post(ELYBY_ENDPOINT + ELYBY_VALIDATE_URL, {
            accessToken: accessToken,
        }).done(() => {
            return true;
        }).fail(() => {
            return false;
        });
    }

    // Получить данные аккаунта для авторизации
    static getAccountForAuth = async (uuid) => {
        let accountData = FrogAccountsManager.getAccount(uuid);
        // Проверяем токен
        let validationResult = await FrogElybyManager.validateAccessToken(accountData.accessToken);
        if (!validationResult) {
            // Заново генерируем токен
            let [isRefreshSuccess, refreshResult] = await FrogElybyManager.refreshAccessToken(accountData.accessToken);
            if (!isRefreshSuccess) {
                // Если ошибка генерации - удаляем акк и просим добавить заново
                $("#modal-elybyLogin .error").text(MESSAGES.elyby.repeat);
                await FrogModals.showModal("elybyLogin");
                FrogAccountsManager.deleteAccount(uuid);
                FrogFlyout.setUIStartMode(false);
                await FrogFlyout.changeMode("idle");
                return false;
            } else {
                // Сохраняем данные после рефреша
                let accountsData = FrogAccountsManager.getAccounts();
                accountData.accessToken = refreshResult.accessToken;
                accountData.nickname = refreshResult.selectedProfile.name;
                accountsData[uuid] = accountData;
                await FrogAccountsManager.saveAccounts(accountsData);

                // Возвращаем данные
                return {
                    access_token: accountData.accessToken,
                    client_token: accountData.clientToken,
                    uuid: accountData.uuid,
                    name: accountData.nickname,
                };
            }
        } else {
            return {
                access_token: accountData.accessToken,
                client_token: accountData.clientToken,
                uuid: accountData.uuid,
                name: accountData.nickname,
            };
        }
    }

    // Получить текстуру головы скина Ely.by по нику
    static getHeadURLByPlayerNickname = (nickname) => {
        return new Promise(resolve => {
            let fileUrl = `http://skinsystem.ely.by/skins/${nickname}.png`;
            let filePath = path.join(USERDATA_PATH, "elybySkins", `${nickname}.png`);
            if (!fs.existsSync(path.dirname(filePath))) {
                fs.mkdirSync(path.dirname(filePath));
            }
            Jimp.read(fileUrl, (err, image) => {
                let imgWidth = image.bitmap.width;
                let headWidth = imgWidth / 8;
                let headResizeSize;
                headWidth > 40 ? headResizeSize = headWidth : headResizeSize = 40;
                image.crop(headWidth, headWidth, headWidth, headWidth).resize(headResizeSize, headResizeSize, Jimp.RESIZE_NEAREST_NEIGHBOR).writeAsync(filePath).then(() => {
                    return resolve(filePath);
                });
            });
        });
    }
}