const superagent = require('superagent');
const fs = require('fs');
const itembase = require('../items.json');
const knex = require('knex')({
    client: 'pg',
    connection: {
        user: 'news_bot',
        host: '10.0.0.104',
        database: 'price_spy',
        password: 'tachi',
        port: 5432
    }
});


fuzzy_search_item("Soma");

module.exports = {
    fuzzy_search_item,
}
async function fuzzy_search_item(name) {
    let processed = [];
    let raw_results = await knex.select('*').from('items').whereRaw(`items.item_name LIKE '%${name}%'`)
    if (raw_results.length > 0) {
        for (let i =0; i<raw_results.length; i++) {
            let result = raw_results[i];
            let drops = await knex.select("name").from('drops').whereRaw(`drops.item_id = '${result.id}'`)
            let prices = await knex.select(["avg_price","timestamp", "highest_price", "lowest_price"]).from('price_history').whereRaw(`price_history.item_id = '${result.id}'`)
            let total = 0;
            let high = 0;
            let low = 1000;
            for(let pid =0; pid<prices.length;pid++){
                let price = prices[pid];
                total+=price.avg_price;
                if (price.highest_price > high) high = price.highest_price;
                if (price.lowest_price < low) low = price.lowest_price;
            }
            let avg = total/prices.length;
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
    await fs.writeFileSync(`./${name}.fuzzy.json`, JSON.stringify(processed));
    process.exit()
}