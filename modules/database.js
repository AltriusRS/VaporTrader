const config = require('../config.json');
const knex = require('knex')({
    client: 'pg',
    connection: config.database
});

module.exports = {
    fuzzy_search_item,
    countItems,
    checkRelic
}

async function fuzzy_search_item(name) {
    let processed = [];
    let raw_results = await knex.select('*').from('items').whereRaw(`items.item_name LIKE '%${name}%' OR items.url_name LIKE '%${name.toLowerCase().split(' ').join('_')}%' ORDER BY items.item_name ASC`)
    if (raw_results.length > 0) {
        for (let i = 0; i < raw_results.length; i++) {
            let result = raw_results[i];
            let drops = await knex.select("name").from('drops').whereRaw(`drops.item_id = '${result.id}'`)
            let prices = await knex.select(["avg_price", "timestamp", "highest_price", "lowest_price"]).from('price_history').whereRaw(`price_history.item_id = '${result.id}'`)
            let total = 0;
            let high = 0;
            let low = 1000;
            for (let pid = 0; pid < prices.length; pid++) {
                let price = prices[pid];
                total += price.avg_price;
                if (price.highest_price > high) high = price.highest_price;
                if (price.lowest_price < low) low = price.lowest_price;
            }
            let avg = total / prices.length;
            if (isNaN(avg)) avg = 0;
            if (low > high) low = high;
            result.drops = drops;
            result.prices = prices;
            result.highest_price = high
            result.lowest_price = low
            result.avg_price = avg
            processed.push(result)
        }
    }
    while (processed.length !== raw_results.length) {

    }
    return processed;
}

async function countItems() {
    let raw_results = await knex.count('items.id').from('items').whereRaw(`items.tradable = TRUE`);
    return raw_results[0].count
}

async function makeList(user, name) {
    await knex.insert({user_id}).into("wish_lists")
}

// insertRelics()
// async function insertRelics() {
//     let relics = require('../formatting.json').relics;
//     await knex.insert(relics).into('relics');
// }

async function checkRelic(relic) {
    let raw_results = await knex.select('relics.vaulted').from('relics').whereRaw(`relics.name = '${relic}'`);
    return raw_results[0].vaulted;
}