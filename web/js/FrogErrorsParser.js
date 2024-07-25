let isMCErrorShown = false;

const ERRORS_DESCRIPTIONS = [
    "Данная версия игры несовместима с используемой версией Java.<br>Если вы используете автоматическое определение версии Java, то пожалуйста свяжитесь с разработчиком для исправления ошибки",
    "Похоже версия Java и версия Forge несовместимы!<br>Если вы используете автоматическое определение версии Java, то пожалуйста свяжитесь с разработчиком для исправления ошибки",
    "Не удалось выделить необходимое количество памяти для Java<br>Попробуйте уменьшить количество памяти в настройках лаунчера",
    "Похоже потерялся исполняемый JAR-файл игры <br>Попробуйте перезапустить лаунчер",
    "Лаунчер не может найти исполняемый файл Java!<br>Если вы используете автоматическое определение версии Java, то пожалуйста свяжитесь с разработчиком для исправления ошибки",
    "Возможно конфигурация или файлы игры повреждены или созданы более новой версией игры. Рекомендуем переустановить игру начисто, сменив в настройках лаунчера путь к папке",
    "Попробуйте перезапустить игру ещё раз, если не поможет - рекомендуется полная переустановка игры"
];

const ERRORS_MESSAGES = {
    "java.lang.ClassCastException: class jdk.internal.loader":
        ERRORS_DESCRIPTIONS[0],
    "java.lang.NoSuchMethodError: sun.security.util.ManifestEntryVerifier":
        ERRORS_DESCRIPTIONS[1],
    "java.lang.UnsupportedClassVersionError": ERRORS_DESCRIPTIONS[0],
    "Could not reserve enough space": ERRORS_DESCRIPTIONS[2],
    "Main has been compiled by a more recent": ERRORS_DESCRIPTIONS[0],
    "The system cannot find the path specified": ERRORS_DESCRIPTIONS[4],
    "at java.base/java.io.Reader.<init>": ERRORS_DESCRIPTIONS[5],
    "requires version": ERRORS_DESCRIPTIONS[0],
    "java.io.IOException: error reading": ERRORS_DESCRIPTIONS[5],
    "ava.lang.NoClassDefFoundError: com/mojang/authlib/properties/PropertyMap": ERRORS_DESCRIPTIONS[6],
    "Failed to start due to Error: ENOENT: no such file or directory": ERRORS_DESCRIPTIONS[6]
};

class FrogErrorsParser {
    static parse(line = "", exitCode = 0) {
        let errorHappend = false;
        if (line === "" && exitCode) {
            if (exitCode > 0 && exitCode !== 127 && exitCode !== 255) {
                FrogCollector.writeLog(`Crash: Exit code ${exitCode}`);
                if (isMCErrorShown === false) {
                    FrogAlerts.create(
                        "О нет, что-то пошло не так",
                        "Minecraft завершился с кодом ошибки " +
                        exitCode +
                        "<br>Подрбоная информация в консоли",
                        "Закрыть",
                        "error",
                        () => {
                            isMCErrorShown = false;
                        }
                    );
                    isMCErrorShown = true;
                }
                errorHappend = true;
            } else {
                FrogCollector.writeLog(`Crash: Force terminated with code ${exitCode}`);
            }
        } else {
            for (const [key, value] of Object.entries(ERRORS_MESSAGES)) {
                let nreg = new RegExp(key, "gmi");
                if (line.match(nreg) != null && isMCErrorShown === false) {
                    isMCErrorShown = true;
                    FrogAlerts.create(
                        "Ой, что-то произошло!",
                        value,
                        "Закрыть",
                        "warning",
                        () => {
                            isMCErrorShown = false;
                        }
                    );
                    errorHappend = true;
                }
            }
        }
    }
}
