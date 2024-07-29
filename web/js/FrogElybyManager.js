const ELYBY_ENDPOINT = "https://authserver.ely.by";
const ELYBY_AUTH_URL = "/auth/authenticate";
const ELYBY_REFRESH_URL = "/auth/refresh";
const ELYBY_VALIDATE_URL = "/auth/validate";

class FrogElybyManager {
    // Войти в аккаунт (возвращает success, data/error)
    static loginAccount(login, password, totpToken = "") {
        return new Promise((resolve) => {
            machineUuid().then((clientToken) => {
                if (totpToken !== "") {
                    password = password + ":" + totpToken;
                }
                $.post(ELYBY_ENDPOINT + ELYBY_AUTH_URL, {
                    username: login,
                    password: password,
                    clientToken: clientToken,
                    requestUser: true
                }).done((data) => {
                    return resolve([true, data, clientToken]);
                }).fail((err) => {
                    if (err.responseJSON.errorMessage.match(/Invalid credentials/gim) !== null) {
                        return resolve([false, "INVALID_CREDENTIALS", clientToken]);
                    } else if (err.responseJSON.errorMessage.match(/two factor auth/gim) !== null) {
                        return resolve([false, "REQUIRES_TOTP", clientToken]);
                    } else {
                        return resolve([false, err.responseJSON.errorMessage, clientToken]);
                    }
                })
            });
        })
    }

    // Обновить access token
    static refreshAccessToken(authToken) {
        return new Promise(resolve => {
            machineUuid().then((clientToken) => {
                $.post(ELYBY_ENDPOINT + ELYBY_REFRESH_URL, {
                    authToken: authToken,
                    clientToken: clientToken,
                    requestUser: true,
                }).done((data) => {
                    return resolve([true, data, clientToken]);
                }).fail((err) => {
                    return resolve([false, err.responseJSON.errorMessage, clientToken]);
                })
            });
        })
    }

    // Валидировать access token
    static validateAccessToken(accessToken) {
        return new Promise((resolve) => {
            $.post(ELYBY_ENDPOINT + ELYBY_VALIDATE_URL, {
                accessToken: accessToken,
            }).done(() => {
                return resolve(true);
            }).fail(() => {
                return resolve(false);
            });
        })
    }

    // Получить данные аккаунта для авторизации
    static getAccountForAuth = (uuid) => {
        return new Promise(resolve => {
            let accountData = FrogAccountsManager.getAccount(uuid);
            // Проверяем токен
            FrogElybyManager.validateAccessToken(accountData.accessToken).then(validationResult => {
                if (!validationResult) {
                    // Заново генерируем токен
                    FrogElybyManager.refreshAccessToken(accountData.authToken).then(refreshResult => {
                        if (!refreshResult[0]) {
                            // Если ошибка генерации - удаляем акк и просим добавить заново
                            $("#modal-elybyLogin .error").text(MESSAGES.elyby.repeat);
                            FrogModals.showModal("elybyLogin");
                            FrogAccountsManager.deleteAccount(uuid);
                            return resolve(false);
                        } else {
                            // Сохраняем данные после рефреша
                            let accountsData = FrogAccountsManager.getAccounts();
                            accountData.accessToken = refreshResult.accessToken;
                            accountData.nickname = refreshResult.selectedProfile.name;
                            accountsData[uuid] = accountData;
                            FrogAccountsManager.saveAccounts(accountsData);

                            // Возвращаем данные
                            return resolve({
                                access_token: accountData.accessToken,
                                client_token: accountData.clientToken,
                                uuid: accountData.uuid,
                                name: accountData.nickname,
                            });
                        }
                    })
                } else {
                    return resolve({
                        access_token: accountData.accessToken,
                        client_token: accountData.clientToken,
                        uuid: accountData.uuid,
                        name: accountData.nickname,
                    });
                }
            });
        })
    }

    // Получить текстуру головы скина Ely.by по нику
    static getHeadURLByPlayerNickname = (nickname) => {
        return new Promise(resolve => {
            let fileUrl = `http://skinsystem.ely.by/skins/${nickname}.png`;
            let filePath = path.join(global.USERDATA_PATH, "elybySkins", `${nickname}.png`);
            if (!fs.existsSync(path.dirname(filePath))) {
                fs.mkdirSync(path.dirname(filePath));
            }
            Jimp.read(fileUrl, (err, image) => {
                image.crop(8, 8, 8, 8).write(filePath);
                return resolve(filePath);
            });
        });
    }
}