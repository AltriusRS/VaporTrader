const fs = require('fs');
const axios = require('axios');
const relics = ["lith", "meso", "axi", "neo", "requiem"]
const table = require('./wiki.json')
const all_drops = (require('csv-parse/lib/sync')(fs.readFileSync('./items.psv', "utf8"), {
    columns: true,
    delimiter: "|",
    skip_empty_lines: true
}))
let found = [];
let drops = {}

start();

async function start() {
    let items = (await axios.get("https://api.warframe.market/v1/items")).data.payload.items;
    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        if (includes(item.item_name.toLowerCase(), relics)) {
            found.push(parseEra(item.item_name, item.url_name));
        }
    }
    for (let i = 0; i < found.length; i++) {
        let relic = found[i];
        if (relic) {
            if (drops[relic.era] === undefined) drops[relic.era] = {};
            if (drops[relic.era][relic.name] === undefined) drops[relic.era][relic.name] = {
                drops: {
                    common: [],
                    uncommon: [],
                    rare: []
                }
            };
            if (drops[relic.era][relic.name][relic.refinement.tier] === undefined) drops[relic.era][relic.name][relic.refinement.tier] = {
                url: relic.url,
                chances: relic.refinement.chances
            };
        }
    }
    for (let i = 0; i < all_drops.length; i++) {
        let drop = all_drops[i];
        drops[drop.tier][drop.name].drops[drop.rarity.toLowerCase()].push({
            item: `${drop.item} ${drop.part}`,
            url: `${drop.item}_${drop.part}`.toLowerCase().split(" ").join("_"),
            vaulted: drop.vaulted
        })
    }
    await fs.writeFileSync('./relics.json', JSON.stringify(drops));
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function parseRefinement(relic) {
    if (relic.includes("Intact")) return {
        name: relic.split(" Intact")[0],
        refinement: relic.split(" ")[2],
        chances: {
            common: 25.33,
            uncommon: 11,
            rare: 2
        }
    };
    if (relic.includes("Exceptional")) return {
        name: relic.split(" Exceptional")[0],
        refinement: relic.split(" ")[2],
        chances: {
            common: 23.33,
            uncommon: 13,
            rare: 4
        }
    };
    if (relic.includes("Flawless")) return {
        name: relic.split(" Flawless")[0],
        refinement: relic.split(" ")[2],
        chances: {
            common: 20,
            uncommon: 17,
            rare: 6
        }
    };
    if (relic.includes("Radiant")) return {
        name: relic.split(" Radiant")[0],
        refinement: relic.split(" ")[2],
        chances: {
            common: 16.67,
            uncommon: 20,
            rare: 10
        }
    };
}

function parseEra(relic, url) {
    let info = parseRefinement(relic);
    if (relic.includes("Lith")) return {
        era: "Lith",
        name: info.name.split("Lith ")[1],
        refinement: {tier: info.refinement, chances: info.chances},
        url
    };
    if (relic.includes("Meso")) return {
        era: "Meso",
        name: info.name.split("Meso ")[1],
        refinement: {tier: info.refinement, chances: info.chances},
        url
    };
    if (relic.includes("Axi")) return {
        era: "Axi",
        name: info.name.split("Axi ")[1],
        refinement: {tier: info.refinement, chances: info.chances},
        url
    };
    if (relic.includes("Neo")) return {
        era: "Neo",
        name: info.name.split("Neo ")[1],
        refinement: {tier: info.refinement, chances: info.chances},
        url
    };
    if (relic.includes("Requiem")) return {
        era: "Requiem",
        name: info.name.split("Requiem ")[1],
        refinement: {tier: info.refinement, chances: info.chances},
        url
    };
}

function includes(text, contents) {
    let i = false;
    contents.forEach(item => {
        if (text.includes(item)) i = true;
    })
    return i;
}