class FrogServersUI {
    // Загрузить список серверов
    static loadList = async () => {
        let [isSuccess, servers] = await FrogRequests.get(SERVERS_URL);
        if (!isSuccess) {
            return false;
        }

        // Очищаем список
        $("#modal-servers .serversList .item:not(.placeholder)").remove();

        // Получаем код placeholder`а
        let placeholder = $("#modal-servers .serversList .item.placeholder")[0].outerHTML;
        placeholder = placeholder.replace(' placeholder', "");
        // По placeholder`у добавляем новые элементы
        servers.servers.forEach((srv) => {
            let preparedPlaceholder = placeholder.replaceAll(/\$1/gim, srv.name)
                .replaceAll(/\$2/gim, srv.description)
                .replaceAll(/\$3/gim, srv.version)
                .replaceAll(/\$4/gim, srv.ip)
                .replaceAll(/\$5/gim, srv.icon)
                .replaceAll(/\$6/gim, srv.ip + ":" + srv.port)
                .replaceAll(/\$7/gim, srv.flVersion);
            $("#modal-servers .serversList").append(preparedPlaceholder);
        })

        // Показываем все в списке
        $("#modal-servers .serversList .item").each(function () {
            if (!$(this).hasClass("placeholder")) {
                $(this).show();
            }
        })
        FrogServersUI.refreshServersInfo();
        return true;
    }

    // Скопировать IP сервера
    static copyServerIP(ip) {
        navigator.clipboard.writeText(ip);
        FrogToasts.create(MESSAGES.servers.ipCopied, "share");
    }

    // Получить статус и информацию о сервере
    static queryServer = async (ip) => {
        let port = 25565;
        if(ip.split(":").length === 2){
            port = ip.split(":")[1];
            ip = ip.split(":")[0];
        }
        try {
            let query = await GameDig.query({type: "minecraft", host: ip, port: port});
            return {
                online: true,
                data: query
            }
        } catch(e) {
            return {
                online: false
            };
        }
    }

    // Обновить информацию о серверах в списке
    static refreshServersInfo = () => {
        $("#modal-servers .serversList .item:not(.placeholder)").each(async function () {
            let $status = $(this).find("div.status");
            let $onlineChip = $(this).find("div.cap-div div.chip");
            let ip = $(this).data("ip");

            $status.removeClass("online offline");
            $onlineChip.text("...");

            let serverQuery = await FrogServersUI.queryServer(ip);
            if(!serverQuery.online){
                $status.addClass("offline");
                $onlineChip.hide();
            } else {
                $status.addClass("online");
                $onlineChip.show();
                $onlineChip.text(`${serverQuery.data.numplayers} / ${serverQuery.data.maxplayers}`);
            }
        })
    }

    // Играть на сервере
    static playOnServer = async (ip, versionId) => {
        selectedServerFromList = ip;
        FrogVersionsManager.setActiveVersion(versionId);
        FrogFlyout.startSelectedVersion();
        return true;
    }
}