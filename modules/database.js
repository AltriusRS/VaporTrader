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

start()

async function start() {
    let processed = 0;
    let items = [];
    let drops = [];
    let price_history = []
    for (const item of itembase) {
        let stored_item = await knex.select('*').from('items').whereRaw(`items.id = \'${item._id}\'`);
        if (stored_item[0] == null || stored_item[0] == undefined) {

            console.log(`${item.en.item_name} (${item._id}) not found in database`)
            items.push({
                id: item._id,
                item_name: item.en.item_name,
                tradable: item.tradable,
                icon: item.icon,
                url_name: item.url_name,
                wiki_link: item.en.wiki_link,
                trade_tax: item.trading_tax
            });
            item.en.drop.forEach(drop => {
                drops.push({
                    item_id: item._id,
                    name: drop.name
                })
            })

            try {
                processed+=1;
                let {body} = await superagent.get(`https://api.warframe.market/v1/items/${item.url_name}/statistics`)
                let prices = body.payload.statistics_closed['90days'];
                prices.forEach(price => {
                    price_history.push({
                        item_id: item._id,
                        timestamp: price.datetime,
                        avg_price: price.avg_price,
                        highest_price: price.max_price,
                        lowest_price: price.min_price
                    })
                })
            } catch(e) {
                if(e.status === 503){
                    console.log(`unable to get price stats for (${item._id})`);
                } else {
                    console.log(e)
                }
            }
        }
        if (processed === itembase.length) {
            write(items, drops, price_history)
        }
    }
}

async function write(items, drops, price_history) {
    let dropsql = knex.insert(drops).into('drops').toQuery();
    let itemsql = knex.insert(items).into('items').toQuery();
    let pricesql = knex.insert(price_history).into('price_history').toQuery();
    let sql = `${dropsql}\n${itemsql}\n${pricesql}`;

    await fs.writeFileSync('./items.sql', sql);
}