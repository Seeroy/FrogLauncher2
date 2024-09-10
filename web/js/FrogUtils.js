class FrogUtils {
    // Random Integer
    static getRandomInt = (max) => {
        return Math.floor(Math.random() * max);
    }

    // Расширение файла
    static fileExt = (file) => {
        return path.extname(file);
    }

    // Имя файла из ссылки
    static getFilenameFromURL = (url) => {
        return url.split("/").splice(-1)[0];
    }

    // Первая буква большая
    static capitalizeWord = (word) => {
        word = word.toString();
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    // Проверить текст по массиву регулярок
    static isTextMatchRegexpArray = (regexpArray, text) => {
        let matches = false;
        regexpArray.forEach(function (status) {
            if (text.match(status) != null) {
                matches = true;
            }
        });
        return matches;
    }

    // Округлить до 512
    static round512 = (x) => {
        return Math.ceil(x / 512) * 512;
    }

    // Создать недостающие директории в пути
    static createMissingDirectories = (path) => {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, {recursive: true});
            return true;
        }
        return false;
    }

    // Размер файла в человеко-читаемый
    static humanFileSize(bytes, si = false, dp = 1) {
        const thresh = si ? 1000 : 1024;

        if (Math.abs(bytes) < thresh) {
            return bytes + ' B';
        }

        const units = si
            ? MESSAGES.units.size1 : MESSAGES.units.size2;
        let u = -1;
        const r = 10 ** dp;

        do {
            bytes /= thresh;
            ++u;
        } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


        return bytes.toFixed(dp) + ' ' + units[u];
    }

    // Удалить элемент из массива
    static removeElementFromArray = (array, element) => {
        let index = array.indexOf(element);
        if (index > -1) {
            array.splice(index, 1);
        }
        return array;
    }

    // Сравнить массивы (возвращает совпадения)
    static compareArrays = (arr1, arr2) => {
        let arr3 = [];
        arr1.forEach((item) => {
            arr2.forEach((item2) => {
                if (item == item2) {
                    arr3.push(item);
                }
            });
        });
        return arr3;
    }

    // Парсинг пути массива, например (test.inner.child)
    static parseNestedObjectPath(path, obj) {
        let pathSplit = path.split(".");
        let currentInner = obj;
        let arrayResult = false;
        pathSplit.forEach((currentPath, i) => {
            if (typeof currentInner[currentPath] === "undefined") {
                arrayResult = false;
            }

            currentInner = currentInner[currentPath];
            if (i === (pathSplit.length - 1)) {
                arrayResult = currentInner;
            }
        });
        return arrayResult;
    }

    // Найти самый глубокий элемент в DOM
    static findDeepNested(element, currentLevel) {
        let deepestLevel = 0;
        let deepestLevelText;

        if ((element.children().length === 0) && (deepestLevel < currentLevel)) {
            // No children and current level is deeper than previous most nested level
            deepestLevelText = element.text();
        } else { // there are children, keep diving
            element.children().each(function () {
                FrogUtils.findDeepNested($(this), currentLevel + 1);
            });
        }
    }

    // Обёртка для compressing
    static unpackArchive = async (archivePath, unpackPath) => {
        let archiveType = "zip";
        if (path.extname(archivePath) === ".tar") {
            archiveType = "tar";
        }
        if (path.extname(archivePath) === ".tar.gz" || path.extname(archivePath) === ".tgz") {
            archiveType = "tgz";
        }
        return await compressing[archiveType].uncompress(archivePath, unpackPath);
    }

    // Обёртка для compressing
    static compressDirectory = async (archivePath, directoryPath) => {
        let archiveType = "zip";
        if (path.extname(archivePath) === ".tar") {
            archiveType = "tar";
        }
        if (path.extname(archivePath) === ".tar.gz" || path.extname(archivePath) === ".tgz") {
            archiveType = "tgz";
        }
        return await compressing[archiveType].compressDir(directoryPath, archivePath);
    }

    // Генерация рандомной строки
    static randomString = (length = 16) => {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < length) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
            counter += 1;
        }
        return result;
    }

    // Удалить игровые цвета из строки
    static removeColorsFromString = (str) => {
        return str.replaceAll(/§[0-9A-FK-OR]/gim, "");
    }

    // Транслит текста
    static translit = (word) => {
        let answer = ""
            , a = {};

        a["Ё"] = "YO";
        a["Й"] = "I";
        a["Ц"] = "TS";
        a["У"] = "U";
        a["К"] = "K";
        a["Е"] = "E";
        a["Н"] = "N";
        a["Г"] = "G";
        a["Ш"] = "SH";
        a["Щ"] = "SCH";
        a["З"] = "Z";
        a["Х"] = "H";
        a["Ъ"] = "'";
        a["ё"] = "yo";
        a["й"] = "i";
        a["ц"] = "ts";
        a["у"] = "u";
        a["к"] = "k";
        a["е"] = "e";
        a["н"] = "n";
        a["г"] = "g";
        a["ш"] = "sh";
        a["щ"] = "sch";
        a["з"] = "z";
        a["х"] = "h";
        a["ъ"] = "'";
        a["Ф"] = "F";
        a["Ы"] = "I";
        a["В"] = "V";
        a["А"] = "A";
        a["П"] = "P";
        a["Р"] = "R";
        a["О"] = "O";
        a["Л"] = "L";
        a["Д"] = "D";
        a["Ж"] = "ZH";
        a["Э"] = "E";
        a["ф"] = "f";
        a["ы"] = "i";
        a["в"] = "v";
        a["а"] = "a";
        a["п"] = "p";
        a["р"] = "r";
        a["о"] = "o";
        a["л"] = "l";
        a["д"] = "d";
        a["ж"] = "zh";
        a["э"] = "e";
        a["Я"] = "Ya";
        a["Ч"] = "CH";
        a["С"] = "S";
        a["М"] = "M";
        a["И"] = "I";
        a["Т"] = "T";
        a["Ь"] = "'";
        a["Б"] = "B";
        a["Ю"] = "YU";
        a["я"] = "ya";
        a["ч"] = "ch";
        a["с"] = "s";
        a["м"] = "m";
        a["и"] = "i";
        a["т"] = "t";
        a["ь"] = "'";
        a["б"] = "b";
        a["ю"] = "yu";

        for (let i in word) {
            if (word.hasOwnProperty(i)) {
                if (a[word[i]] === undefined) {
                    answer += word[i];
                } else {
                    answer += a[word[i]];
                }
            }
        }
        return answer;
    }

    // Секунды -> ч. м. с.
    static toHHMMSS = (secs) => {
        var sec_num = parseInt(secs, 10)
        var hours = Math.floor(sec_num / 3600)
        var minutes = Math.floor(sec_num / 60) % 60
        var seconds = sec_num % 60

        return [hours, minutes, seconds]
            .map(v => v < 10 ? "0" + v : v)
            .filter((v, i) => v !== "00" || i > 0)
            .join(":")
    }

    // Получить директорию игры из versionId
    static getGameRoot = (versionId) => {
        let isDirSplitEnabled = FrogConfig.read("separatedStorage") === true || FrogConfig.read("fullySeparatedStorage") === true;

        let parsedVersionId = FrogVersionsManager.parseVersionID(versionId);
        // Если это не модпак
        if(parsedVersionId.type !== "pack"){
            if(isDirSplitEnabled){
                return path.join(GAME_DATA, "home", versionId);
            }
            return path.join(GAME_DATA);
        } else {
            return path.join(GAME_DATA, "modpacks", parsedVersionId.name);
        }
    }
}