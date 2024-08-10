const FROG_ALERT_PLACEHOLDER =
    '<dialog class="alert-modal modal-bg" id="$5"> <div class="alert-window"> <div class="alert-icon">$4</div> <div class="alert-caption">$1</div> <div class="alert-description">$2</div> <button id="cmbtn-$5" class="custom-button w-full mt-4 text-white">$3</button> $6 </div> </dialog>';

class FrogAlerts {
    static create(caption, text, buttonText, icon, cb = () => {
    }, additionalElements = "") {
        icon = `<span class="material-symbols-outlined">${icon}</span>`;
        let randomID = "alert-" + Math.floor(Math.random() * (1000 - 10 + 1)) + 10;
        $("body").append(
            FROG_ALERT_PLACEHOLDER.replaceAll(/\$1/gim, caption)
                .replaceAll(/\$2/gim, text)
                .replaceAll(/\$3/gim, buttonText)
                .replaceAll(/\$4/gim, icon)
                .replaceAll(/\$5/gim, randomID)
                .replaceAll(/\$6/gim, additionalElements)
        );
        animateCSSNode($("#" + randomID)[0], "fadeIn", true);
        $("#cmbtn-" + randomID)
            .click(function () {
                animateCSSNode($("#" + randomID)[0], "fadeOut", true).then(() => {
                    $(this).parent().parent().remove();
                });
                cb();
            });
    }
}