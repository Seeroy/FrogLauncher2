const fs = require("fs");
let reference = JSON.parse(fs.readFileSync('./web/languages/ru.json').toString());
let referenceKeys = Object.keys(flatten(reference));

const languagesList = fs.readdirSync("./web/languages");

languagesList.forEach((lang) => {
    if(lang !== "ru.json"){
        let langData = JSON.parse(fs.readFileSync(`./web/languages/${lang}`).toString());
        let flattenLang = Object.keys(flatten(langData));
        let difference = referenceKeys.filter(x => !flattenLang.includes(x));
        if(difference.length === 0){
            console.log(`Язык ${lang} не имеет проблем`);
        } else {
            console.log(`Язык ${lang} имеет ${difference.length} проблем:`);
            console.log(difference);
        }
    }
})

function traverseAndFlatten(currentNode, target, flattenedKey) {
    for (let key in currentNode) {
        if (currentNode.hasOwnProperty(key)) {
            let newKey;
            if (flattenedKey === undefined) {
                newKey = key;
            } else {
                newKey = flattenedKey + '.' + key;
            }

            let value = currentNode[key];
            if (typeof value === "object") {
                traverseAndFlatten(value, target, newKey);
            } else {
                target[newKey] = value;
            }
        }
    }
}

function flatten(obj) {
    let flattenedObject = {};
    traverseAndFlatten(obj, flattenedObject);
    return flattenedObject;
}