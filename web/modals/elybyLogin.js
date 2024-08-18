class FrogElybyLoginUI {
    static login = () => {
        let login = $("#modal-elybyLogin input.login").val();
        let password = $("#modal-elybyLogin input.password").val();
        let totp = $("#modal-elybyLogin input.totp").val();

        let $error = $("#modal-elybyLogin .error");

        if (login !== "" && password !== "") {
            $("#modal-elybyLogin .loginBtn").hide();
            $error.hide();

            FrogElybyManager.loginAccount(login, password, totp).then((data) => {
                $("#modal-elybyLogin .loginBtn").show();
                $("#modal-elybyLogin input.totp").val("");

                let isSuccess = data[0];
                let clientToken = data[2];
                data = data[1];

                if (!isSuccess) {
                    $error.show();
                    // Показываем ошибку
                    if (typeof MESSAGES.elyby[data] !== "undefined") {
                        $error.text(MESSAGES.elyby[data]);
                    } else {
                        $error.text(data);
                    }
                    return false;
                } else {
                    if (FrogAccountsManager.isAccountExistsByNickname(data.selectedProfile.name, "elyby")) {
                        FrogToasts.create(MESSAGES.accounts.alreadyExists);
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
                    FrogElybyManager.getHeadURLByPlayerNickname(data.selectedProfile.name).then(() => {
                        FrogAccountsManager.saveAccounts(accountsList);
                    });

                    $("#modal-elybyLogin input").val("");
                    FrogModals.hideModal("elybyLogin").then(() => {
                        FrogToasts.create(data.selectedProfile.name, "person", MESSAGES.commons.newAccountAdded);
                    });
                    return true;
                }
            });
        }
    }
}