class FrogServersUI {
    // Загрузить список серверов
    static loadList = () => {
        return new Promise(resolve => {
            $.get(global.SERVERS_URL, (servers) => {
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
                return resolve(true);
            })
        })
    }

    // Скопировать IP сервера
    static copyServerIP(ip) {
        navigator.clipboard.writeText(ip);
        FrogToasts.create("IP скопирован!", "share");
    }
}