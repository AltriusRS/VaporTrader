const itembase = require('../items.json');
const npg = require('node-postgres');
const {Client} = npg;
const client = new Client({
    user: 'news_bot',
    host: '127.0.0.1',
    database: 'price_spy',
    password: 'tachi',
    port: 5432
});