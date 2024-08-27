let gameStatsData;
let currentGameCounter;

class FrogPlayStats {
    // Загрузить всю сохранённую статистику из конфига
    static getAllStats = () => {
        gameStatsData = FrogConfig.read("gameStatistics", {});
        return gameStatsData;
    }

    // Получить статистику по версии
    static getByID = (versionId) => {
        if (typeof gameStatsData[versionId] === "undefined") {
            return false;
        }

        return gameStatsData[versionId];
    }

    // Получить список версий отсортированный по последнему времени запуска
    static getByLastStarted = () => {
        if (Object.values(gameStatsData).length === 0) return [];

        return Object.values(Object.entries(gameStatsData)
            .sort(([, a], [, b]) => b.lastStart - a.lastStart)
            .reduce((r, [k, v]) => ({...r, [k]: v}), {}));
    }

    // Получить список версий отсортированный по времени в игре
    static getByIngameTime = () => {
        if (Object.values(gameStatsData).length === 0) return [];

        return Object.values(Object.entries(gameStatsData)
            .sort(([, a], [, b]) => b.inGame - a.inGame)
            .reduce((r, [k, v]) => ({...r, [k]: v}), {}));
    }

    // Сохранить статистику
    static saveStats = () => {
        return FrogConfig.write("gameStatistics", gameStatsData);
    }

    // Вызывается при запуске игры
    static onGameLaunch = (versionId) => {
        if (typeof gameStatsData[versionId] === "undefined") {
            gameStatsData[versionId] = {
                id: versionId,
                parsed: FrogVersionsManager.parseVersionID(versionId),
                starts: 0,
                inGame: 0,
                lastStart: 0
            }
        }
        gameStatsData[versionId].starts++;
        gameStatsData[versionId].lastStart = Date.now();
        currentGameCounter = setInterval(() => {
            gameStatsData[versionId].inGame++;
        }, 1000);
        FrogPlayStats.saveStats();
        return true;
    }

    // Вызывается при завершении игры
    static onGameClose = () => {
        clearInterval(currentGameCounter);
        FrogPlayStats.saveStats();
        return true;
    }
}