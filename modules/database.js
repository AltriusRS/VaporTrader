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


itembase.forEach(item => {
    let stored_item = knex.select().from('items').whereRaw('items.id == ??', [item.id])
    if (stored_item == null) {
        console.log(`${item.id} not found in database`)
        knex.insert({
            id: item.id,
            item_name: item.en.name,
            tradable: item.tradable,
            icon: item.icon,
            url_name: item.url_name,
            wiki_link: item.en.wiki_link,
            trade_tax: item.trade_tax
        })
    }
})