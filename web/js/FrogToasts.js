class FrogToasts {
    // Функция отправки нового уведомления
    static create(text, icon = "info", description = "", duration = 5000, iconClasses = "", callback = () => {
    }) {
        let toastsPoolElement = $("#toasts-pool");
        let newID = this.generateID();
        let toastCode = "<div id='toast-" + newID + "' class='toast animate__animate animate__fadeIn animate__faster'>";
        if (iconClasses !== "") {
            toastCode = toastCode + "<div class='icon-bg " + iconClasses + "'><span class='material-symbols-outlined'>" + icon + "</span></div>";
        } else {
            toastCode = toastCode + "<div class='icon-bg'><span class='material-symbols-outlined'>" + icon + "</span></div>";
        }
        if (description !== "") {
            toastCode = toastCode + "<div class='content-2'><div class='caption'>" + text + "</div><div class='description'>" + description + "</div></div>";
        } else {
            toastCode = toastCode + "<div class='caption'>" + text + "</div>";
        }
        toastCode = toastCode + "</div>";
        toastsPoolElement.append(toastCode);
        $("#toast-" + newID).on("click", function () {
            $(this).remove();
            callback();
        });
        if (duration > 0) {
            $("#toast-" + newID)
                .delay(duration)
                .queue(function () {
                    animateCSSNode($(this)[0], "fadeOut", false).then(() => {
                        $(this).remove();
                    });
                });
        }
    }

    // Получить ID для нового уведомления
    static generateID() {
        return $("#toasts-pool .toast").length;
    }

    // Удалить все уведомления
    static removeAll() {
        $("#toasts-pool").html("");
    }
}