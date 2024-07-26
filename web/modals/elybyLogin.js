class FrogElybyLoginUI {
    static login = () => {
        let login = $("#modal-elybyLogin input.login").val();
        let password = $("#modal-elybyLogin input.password").val();
        let totp = $("#modal-elybyLogin input.totp").val();

        let $error = $("#modal-elybyLogin .error");

        if(login !== "" && password !== ""){
            $("#modal-elybyLogin .loginBtn").hide();
            $error.hide();

            FrogElybyManager.loginAccount(login, password, totp).then((data) => {
                $("#modal-elybyLogin .loginBtn").show();
                $("#modal-elybyLogin input.totp").val("");

                let isSuccess = data[0];
                let clientToken = data[2];
                data = data[1];

                if(!isSuccess){
                    $error.show();
                    let errorText = "";
                    // Показываем ошибку
                    switch(data){
                        case "INVALID_CREDENTIALS":
                            errorText = "Неверный логин или пароль";
                            break;
                        case "REQUIRES_TOTP":
                            errorText = "Не указан TOTP-токен";
                            break;
                        default:
                            errorText = "Произошла ошибка: " + data;
                            break;
                    }
                    $error.text(errorText);
                    return false;
                } else {
                    if (FrogAccountsManager.isAccountExistsByNickname(data.selectedProfile.name, "elyby")) {
                        FrogToasts.create("Данный аккаунт уже существует");
                        return false;
                    }

                    // Создаём аккаунт
                    let accountData = {
                        type: "elyby",
                        nickname: data.selectedProfile.name,
                        added: Date.now(),
                        clientToken: clientToken,
                        accessToken: data.accessToken,
                        uuid: data.selectedProfile.id,
                    }

                    let accountsList = FrogAccountsManager.getAccounts();
                    accountsList[data.selectedProfile.id] = accountData;
                    FrogAccountsManager.saveAccounts(accountsList);

                    $("#modal-elybyLogin input").val("");
                    FrogModals.hideModal("elybyLogin").then(() => {
                        FrogToasts.create(data.selectedProfile.name, "person", "Добавлен новый аккаунт");
                    });
                    return true;
                }
            });
        }
    }
}