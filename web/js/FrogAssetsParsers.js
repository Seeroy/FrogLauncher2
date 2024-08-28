class FrogAssetsParsers {
    // Прочитать данные о ресурспаке
    static readResourcepack = async (zipFile) => {
        return new Promise(mainResolve => {
            FrogAssetsParsers.clearAssetsCache();
            let icon = "";
            let mcmeta = "";

            fs.createReadStream(zipFile)
                .on('error', (e) => {
                    console.log(e);
                    return mainResolve(false);
                })
                .pipe(new compressing.zip.UncompressStream())
                .on('error', (e) => {
                    console.log(e);
                    return mainResolve(false);
                })
                .on('entry', (header, stream, next) => {
                    stream.on('end', next);

                    if (header.type === 'file') {
                        let fn = path.basename(header.name)
                        if (fn === "pack.png" || fn === "pack.mcmeta") {
                            let writeStream = fs.createWriteStream(path.join(path.dirname(zipFile), fn));
                            stream.pipe(writeStream);
                            writeStream.on("close", () => {
                                if (fn === "pack.png") {
                                    icon = new Buffer(fs.readFileSync(writeStream.path)).toString('base64');
                                    fs.unlinkSync(writeStream.path);
                                    return mainResolve({
                                        icon: icon,
                                        mcmeta: mcmeta
                                    })
                                } else if (fn === "pack.mcmeta") {
                                    mcmeta = JSON.parse(fs.readFileSync(writeStream.path).toString()).pack;
                                    fs.unlinkSync(writeStream.path);
                                }
                            })
                        }
                    }
                    stream.resume();
                });
        })
    }

    // Прочитать данные о ресурспаке
    static readResourcePackV2 = (zipFile) => {
        return new Promise(mainResolve => {
            let unpackPath = path.join(GAME_DATA, "cache", "unpacked", path.parse(zipFile).name);
            if (!fs.existsSync(unpackPath)) {
                fs.mkdirSync(unpackPath, {recursive: true});
            }
            FrogUtils.unpackArchive(zipFile, unpackPath).then(result => {
                let icon = false;
                let mcmeta = false;
                if (fs.existsSync(path.join(unpackPath, "pack.png"))) {
                    icon = new Buffer(fs.readFileSync(path.join(unpackPath, "pack.png"))).toString('base64');
                }
                if (fs.existsSync(path.join(unpackPath, "pack.mcmeta"))) {
                    mcmeta = JSON.parse(fs.readFileSync(path.join(unpackPath, "pack.mcmeta")).toString()).pack;
                    mcmeta.description = mcmeta.description?.fallback || mcmeta.description;
                }
                fsExtra.removeSync(unpackPath);
                if (mcmeta === false) {
                    return mainResolve(false);
                }
                return mainResolve({
                    mcmeta: mcmeta,
                    icon: icon
                })
            })
        })
    }

    // Прочитать данные о моде
    static readModInfo = (jarFile) => {
        return new Promise(mainResolve => {
            let unpackPath = path.join(GAME_DATA, "cache", "unpacked", path.parse(jarFile).name);
            if (!fs.existsSync(unpackPath)) {
                fs.mkdirSync(unpackPath, {recursive: true});
            }
            FrogUtils.unpackArchive(jarFile, unpackPath).then(result => {
                let fabricJsonPath = path.join(unpackPath, "fabric.mod.json");
                let fabricJson, modsToml;
                let returnResult = false;
                if (fs.existsSync(fabricJsonPath)) {
                    try {
                        fabricJson = JSON.parse(fs.readFileSync(fabricJsonPath).toString());
                    } catch (e) {
                        return mainResolve(false);
                    }
                    let iconPath = path.join(unpackPath, fabricJson.icon);
                    let iconData = new Buffer(fs.readFileSync(iconPath)).toString('base64');
                    returnResult = {
                        name: fabricJson?.name?.trim() ?? "",
                        version: fabricJson?.version?.trim() ?? "",
                        description: fabricJson?.description?.trim() ?? "",
                        authors: fabricJson?.authors ?? [],
                        icon: iconData.trim()
                    }
                }

                let modsTomlPath = path.join(unpackPath, "META-INF", "mods.toml");
                if (fs.existsSync(modsTomlPath)) {
                    modsToml = fs.readFileSync(modsTomlPath).toString();
                    modsToml = toml.parse(modsToml);
                    returnResult = {
                        name: modsToml.mods[0]?.displayName?.trim() ?? "",
                        version: modsToml.mods[0]?.version?.trim() ?? "",
                        description: modsToml.mods[0]?.description?.trim() ?? "",
                        authors: modsToml.mods[0]?.authors ?? [],
                        icon: false
                    }
                }
                fsExtra.removeSync(unpackPath);
                return mainResolve(returnResult);
            })
        })
    }

    // Очистить кэш, использованный при распаковке ассетов
    static clearAssetsCache = () => {
        let dirPath = path.join(GAME_DATA, "cache", "unpacked");
        if (!fs.existsSync(dirPath)) {
            return fs.mkdirSync(dirPath, {recursive: true});
        }
        fsExtra.removeSync(dirPath);
        return fs.mkdirSync(dirPath);
    }
}