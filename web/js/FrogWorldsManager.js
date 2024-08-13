class FrogWorldsManager {
    // Получить директории для поиска миров
    static getSavesDirectories = () => {
        // Читаем из корня
        let saves = [path.join(GAME_DATA, "saves")];

        // Читаем из модпаков
        let modpacksList = FrogPacks.getPacksList();
        if (modpacksList.length > 0) {
            modpacksList = modpacksList.map((item) => path.join(GAME_DATA, "modpacks", item, "saves"));
        }

        // Читаем из /home
        let homePath = path.join(GAME_DATA, "home");
        let homesList = [];
        if (fs.existsSync(homePath)) {
            homesList = fs.readdirSync(homePath);
            if (homesList.length > 0) {
                homesList = homesList.map((item) => path.join(homePath, item, "saves"));
            }
        }

        saves = saves.concat(modpacksList, homesList);
        return saves;
    }

    // Получить список сейвов из директории с данными о них
    static savesFromDirectory = (directory) => {
        return new Promise(resolve => {
            if(!fs.existsSync(directory)){
                return resolve(false);
            }

            var saves = fs.readdirSync(directory);
            var result = [];
            var currentWorld = -1;
            var savesResolve = resolve;

            nextWorld();

            function nextWorld(){
                currentWorld++;
                if(typeof saves[currentWorld] !== "undefined"){
                    var fullWorldPath = path.join(directory, saves[currentWorld]);
                    FrogWorldsManager.getWorldInfo(fullWorldPath).then(data => {
                        if(data !== false){
                            data.path = fullWorldPath;
                            result.push(data);
                        }
                        nextWorld();
                    })
                } else {
                    return savesResolve(result);
                }
            }
        })
    }

    // Получить все миры из директории игры
    static getAllWorlds = () => {
        return new Promise(resolve => {
            let savesDirectories = FrogWorldsManager.getSavesDirectories();
            if(savesDirectories.length === 0){
                return resolve([]);
            }

            var result = [];
            var savesResolve = resolve;
            var currentSave = -1;

            nextSave();

            function nextSave(){
                currentSave++;
                if(typeof savesDirectories[currentSave] !== "undefined"){
                    FrogWorldsManager.savesFromDirectory(savesDirectories[currentSave]).then(saves => {
                        if(saves === false){
                            saves = [];
                        }
                        result.push({
                            path: savesDirectories[currentSave],
                            worlds: saves
                        })
                        nextSave();
                    })
                } else {
                    return savesResolve(result);
                }
            }
        })
    }

    // Получить информацию о мире
    static getWorldInfo = (worldPath) => {
        return new Promise(resolve => {
            let levelDat = path.join(worldPath, "level.dat");
            let iconPath = path.join(worldPath, "icon.png");
            if (!fs.existsSync(levelDat)) {
                return resolve(false);
            }
            if(!fs.existsSync(iconPath)){
                iconPath = "assets/world.webp";
            }

            let nbtData = new NBT();
            nbtData.loadFromZlibCompressedFile(levelDat, function (err) {
                if (err) {
                    console.log(err);
                    return resolve(false);
                }
                console.log(nbtData.root[""].value.Data.value);
                return resolve({
                    icon: iconPath,
                    name: nbtData.root[""].value.Data.value.LevelName.value,
                    dataPacks: nbtData.root[""].value.Data.value.DataPacks.value,
                    dataVersion: nbtData.root[""].value.Data.value.DataVersion.value,
                    difficulty: nbtData.root[""].value.Data.value.Difficulty.value,
                    version: nbtData.root[""].value.Data.value.Version.value.Name.value,
                    gamemode: nbtData.root[""].value.Data.value.Player.value.playerGameType.value
                });
            });
        })
    }
}