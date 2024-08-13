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
    static unpackArchive(archivePath, unpackPath) {
        return new Promise((resolve ,reject) => {
            let archiveType = "zip";
            if(path.extname(archivePath) === ".tar"){
                archiveType = "tar";
            }
            if(path.extname(archivePath) === ".tar.gz" || path.extname(archivePath) === ".tgz" ){
                archiveType = "tgz";
            }
            compressing[archiveType].uncompress(archivePath, unpackPath)
                .then(resolve)
                .catch(reject);
        })
    }

    // Обёртка для compressing
    static compressDirectory(archivePath, directoryPath) {
        return new Promise((resolve ,reject) => {
            let archiveType = "zip";
            if(path.extname(archivePath) === ".tar"){
                archiveType = "tar";
            }
            if(path.extname(archivePath) === ".tar.gz" || path.extname(archivePath) === ".tgz" ){
                archiveType = "tgz";
            }
            compressing[archiveType].compressDir(directoryPath, archivePath)
                .then(resolve)
                .catch(reject);
        })
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
}