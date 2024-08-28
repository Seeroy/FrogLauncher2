let isMCErrorShown = false;

const ERRORS_DESCRIPTIONS = MESSAGES.errors.list;

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
    "Failed to start due to Error: ENOENT: no such file or directory": ERRORS_DESCRIPTIONS[6],
    "java.lang.NoSuchMethodError": ERRORS_DESCRIPTIONS[7],
    "[authlib-injector] [ERROR] Failed to fetch metadata": ERRORS_DESCRIPTIONS[8]
};

class FrogErrorsParser {
    static parse(line = "", exitCode = 0) {
        let errorHappend = false;
        if (line === "" && exitCode) {
            if (exitCode > 0 && exitCode !== 127 && exitCode !== 255) {
                FrogCollector.writeLog(`Crash: Exit code ${exitCode}`);
                if (isMCErrorShown === false) {
                    FrogAlerts.create(
                        MESSAGES.errors.title,
                        `${MESSAGES.errors.exitCode}: ${exitCode}`,
                        MESSAGES.commons.close,
                        "error",
                        () => {
                            isMCErrorShown = false;
                        }
                    );
                    isMCErrorShown = true;
                }
            } else {
                FrogCollector.writeLog(`Crash: Force terminated with code ${exitCode}`);
            }
        } else {
            for (const [key, value] of Object.entries(ERRORS_MESSAGES)) {
                let nreg = new RegExp(key, "gmi");
                if (line.match(nreg) != null && isMCErrorShown === false) {
                    isMCErrorShown = true;
                    FrogAlerts.create(
                        MESSAGES.errors.title,
                        value,
                        MESSAGES.commons.close,
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
