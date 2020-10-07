const {Pool} = require('pg');
const {distance, closest} = require('fastest-levenshtein');
const all = require('../items.json');

class User {
    constructor(user, config, parent) {
        this.displayName = user.displayName !== undefined ? user.displayName : user.username;
        this.id = user.id;
        this.platform = config.platform;
        this.language = config.lang;
        this.subTier = config.sub_tier;
        this.maxAlerts = config.max_alerts;
        this.ingameName = config.ingame_name;
        this.WFMID = config.wfm_id;
        this.wishlists = [];
        this.getWishLists = async () => {
            this.wishlists = await parent.getUserWishList(this.id, this);
        }
    }
}

class Guild {
    constructor(guild, config, parent) {
        this.id = guild.id;
        this.prefix = config.prefix;
        this.language = config.preferred_language;
        this.premium = config.premium;
        this.name = config.guild_name;
    }
}

class WishListItem {
    constructor(item, member, parent) {
        this.id = item.id;
        this.urlName = item.url_name;
        this.nameEN = item.name_en;
        this.icon = item.icon;
        this.addedBy = member;
    }
}

class DBM {
    constructor(config) {
        this.pool = new Pool(config.database);
    }

    async getRelic(era, name) {
        return new Promise((resolve, reject) => {
            this.pool.query(`SELECT * FROM general.relic_drops WHERE general.relic_drops.era ILIKE '${era}' AND general.relic_drops.relic_name ILIKE '${name}'`, async (err, data) => {
                if (err) reject(err);
                resolve(data.rows)
            })
        })
    }

    async getItemDrops(id) {
        return new Promise((resolve, reject) => {
            this.pool.query(`SELECT * FROM general.item_drops WHERE general.item_drops.item_id = '${id}'`, async (err, data) => {
                if (err) resolve({passed: false, reason: err});
                if (data.rows.length > 0) {
                    resolve(data.rows);
                } else {
                    resolve({passed: false, reason: "Item does not exist"});
                }
            })
        })
    }

    async findItemByName(name, noLev) {
        return new Promise((resolve, reject) => {
            let new_name = name;
            if (!noLev) {
                new_name = closest(name.toLowerCase(), all);
            }
            this.pool.query(`SELECT * FROM general.items WHERE general.items.url_name ILIKE '%${new_name.split(' ').join('_').toLowerCase()}%' OR general.items.name_en ILIKE '%${new_name.split(' ').join(' ')}%'`, async (err, data) => {
                if (err) resolve({passed: false, reason: err});
                if (data.rows.length > 0) {
                    let changed = false;
                    if (new_name !== name) {
                        changed = true;
                    }
                    resolve({results: data.rows, assumed: new_name, original: name, changed});
                } else {
                    resolve({passed: false, reason: "Item does not exist"});
                }
            })
        })
    }

    async countItems() {
        return new Promise((resolve, reject) => {
            this.pool.query(`SELECT COUNT(id) AS "total" FROM general.items`, async (err, data) => {
                if (err) reject(err);
                resolve(data.rows[0].total);
            })
        })
    }

    async getPriceAlerts(raw_item, price, buy, platform) {
        return new Promise((resolve, reject) => {
            if (buy) {
                this.pool.query(`SELECT consumer FROM general.price_alerts WHERE general.price_alerts.platform = '${platform}' AND general.price_alerts.buy = false AND general.price_alerts.threshold <= ${price} AND general.price_alerts.item = '${raw_item}'`, async (err, alerts) => {
                    if (err) reject(err);
                    let people = [];
                    let item = await this.getItemById(raw_item);
                    for (let i = 0; i < alerts.rows.length; i++) {
                        let user = alerts.rows[i];
                        people.push({user: user.consumer, item})
                    }
                    resolve(people)
                })
            } else {
                this.pool.query(`SELECT consumer FROM general.price_alerts WHERE general.price_alerts.platform = '${platform}' AND general.price_alerts.buy = true AND general.price_alerts.threshold >= ${price} AND general.price_alerts.item = '${raw_item}'`, async (err, alerts) => {
                    if (err) reject(err);
                    let people = [];
                    let item = await this.getItemById(raw_item);
                    for (let i = 0; i < alerts.rows.length; i++) {
                        let user = alerts.rows[i];
                        people.push({user: user.consumer, item})
                    }
                    resolve(people)
                })
            }
        })
    }

    async subscribePriceAlert(member, itemName, threshold, wtb) {
        let user = await this.getUserConfig(member);
        return new Promise((resolve, reject) => {
            this.pool.query(`SELECT * FROM general.items WHERE general.items.url_name = '${itemName}'`, async (err, data) => {
                if (err) resolve({passed: false, reason: err});
                if (data.rows.length > 0) {
                    this.pool.query(`INSERT INTO general.price_alerts (consumer, platform, buy, threshold, item) VALUES (${member.id}, '${user.platform.toLowerCase()}', ${wtb}, ${threshold}, '${data.rows[0].id}')`, (error, result) => {
                        if (error) resolve({passed: false, reason: error});

                        resolve({passed: true, reason: undefined});
                    })
                } else {
                    resolve({passed: false, reason: "Item does not exist"});
                }
            })
        })
    }

    async unsubscribePriceAlert(member, itemName) {
        return new Promise((resolve, reject) => {
            this.pool.query(`SELECT * FROM general.items WHERE general.items.url_name = '${itemName}'`, async (err, data) => {
                if (err) resolve({passed: false, reason: err});
                if (data.rows.length > 0) {
                    this.pool.query(`DELETE FROM general.price_alerts WHERE price_alerts.consumer = ${member.id} AND price_alerts.item = '${data.rows[0].id}'`, (error, result) => {
                        if (error) resolve({passed: false, reason: error});

                        resolve({passed: true, reason: undefined});
                    })
                } else {
                    resolve({passed: false, reason: "Item does not exist"});
                }
            })
        })
    }

    async getUserWishList(id, member) {
        return new Promise((resolve, reject) => {
            this.pool.query(`SELECT * FROM general.wish_lists WHERE general.wish_lists.owner = ${id}`, async (err, data) => {
                if (err) reject(err);
                let lists = [];
                for (let i = 0; i < data.rows.length; i++) {
                    let list = data.rows[i];
                    list.items = await this.getListItems(list.id, member)
                    list.subscribers = await this.getListSubscribers(list.id, member)
                    lists.push(list);
                }
                resolve(lists)
            })
        })
    }

    async getListItems(id, member) {
        return new Promise((resolve, reject) => {
            this.pool.query(`SELECT * FROM general.list_items WHERE general.list_items.list = '${id}'`, async (err, data) => {
                if (err) reject(err);
                let items = [];
                for (let i = 0; i < data.rows.length; i++) {
                    let item = data.rows[i];
                    items.push(new WishListItem(await this.getItemById(item.item), await this.getUserConfig({
                        id: item.user,
                        displayName: "FETCH"
                    }), this));
                }
                resolve(items);
            })
        })
    }

    async getItemById(id) {
        return new Promise((resolve, reject) => {
            this.pool.query(`SELECT * FROM general.items WHERE general.items.id = '${id}'`, async (err, data) => {
                if (err) reject(err);
                resolve(data.rows[0]);
            })
        })
    }

    async getListSubscribers(id, member) {
        return new Promise((resolve, reject) => {
            this.pool.query(`SELECT * FROM general.list_subscriptions WHERE general.list_subscriptions.list = '${id}'`, async (err, data) => {
                if (err) reject(err);
                let subscribers = [];
                for (let i = 0; i < data.rows.length; i++) {
                    let item = data.rows[i];
                    subscribers.push(await this.getUserConfig({id: item.subscriber}));
                }
                resolve(subscribers);
            })
        })
    }

    async setUserPlatform(member, platform) {
        return new Promise((resolve, reject) => {
            this.pool.query(`UPDATE general.user_config SET platform = '${platform.toUpperCase()}' WHERE id = ${member.id}`, (err, data) => {
                if (err) reject(err);
                resolve({passed: true});
            })
        })
    }

    async insertUserConfig(member) {
        return new Promise((resolve, reject) => {
            this.pool.query(`INSERT INTO general.user_config (id) VALUES (${member.id})`, (err, data) => {
                if (err) reject(err);
                resolve();
            })
        })
    }

    async getGuildConfig(guild) {
        return new Promise((resolve, reject) => {
            this.pool.query(`SELECT * FROM general.guild_config WHERE general.guild_config.id = ${guild.id}`, async (err, data) => {
                if (err) reject(err);
                if (data.rows.length === 0) {
                    console.log(`Adding guild: ${guild.id} to database`)
                    await this.insertGuildConfig(guild);
                    resolve(new Guild(guild, {guild_name: guild.name, id: guild.id}, this));
                } else {
                    resolve(new Guild(guild, data.rows[0], this));
                }
            })
        })
    }

    async insertGuildConfig(guild) {
        return new Promise((resolve, reject) => {
            this.pool.query(`INSERT INTO general.guild_config (id, guild_name) VALUES (${guild.id}, e'${guild.name.split("'").join("\\'")}')`, (err, data) => {
                if (err) reject(err);
                resolve();
            })
        })
    }

    async getUserConfig(member) {
        return new Promise((resolve, reject) => {
            this.pool.query(`SELECT * FROM general.user_config WHERE general.user_config.id = ${member.id}`, async (err, data) => {
                if (err) reject(err);
                if (data.rows.length === 0) {
                    console.log(`Adding user: ${member.id} to database`)
                    await this.insertUserConfig(member);
                    resolve(new User(member, {platform: 'pc', language: 'en'}, this));
                } else {
                    resolve(new User(member, data.rows[0], this));
                }
            })
        })
    }
}

module.exports.new = (config) => {
    return new DBM(config);
}