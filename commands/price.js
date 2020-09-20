const Discord = require('discord.js');
const superagent = require('superagent');

module.exports = {
    name: "prices",
    aliases: ["p", "price"],
    description: "A commmand that takes your input and returns a set of items matching your description. example: `ps!search Soma Prime`",
    help: (message, client) => {
        let embed = new Discord.MessageEmbed()
            .setColor("#c06ed9")
            .setTitle(module.exports.name)
            .setDescription(module.exports.description)
            .addField("Aliases:", `\`${module.exports.name}\` \`${module.exports.aliases.join("`, `")}\``)
        message.channel.send(embed)
    },
    run: async (message, args, client, dbm) => {
        message.channel.startTyping()
        let search_results = await dbm.fuzzy_search_item(args.join(" ").split('\'').join('\\\''));
        let item = search_results[0];
        if (item === undefined) {
            message.channel.send("Unknown Item")
            message.channel.stopTyping()
        } else {
            let embed = new Discord.MessageEmbed()
                .setColor("#c06ed9")
                .setTitle(`Price Information - ${item.item_name}`)
                .setFooter("These prices may not always be attainable prices on the market, they are averages of the orders currently listing this item");

            let text = `90 day average: ${item.avg_price.toFixed(0)} <:vaportrader:757350560755089460>\n90 day high: ${item.highest_price.toFixed(0)} <:vaportrader:757350560755089460>\n90 day low: ${item.lowest_price.toFixed(0)} <:vaportrader:757350560755089460>\n[View on warframe.market](https://warframe.market/items/${item.url_name})`;
            let modMode = false;
            let averages = undefined;

            try {
                let info = (await superagent.get(`https://api.warframe.market/v1/items/${item.url_name}`)).body.payload;
                if (info.item.items_in_set[0].tags.includes('mod')) modMode = true;
                if (info.item.items_in_set.length > 1) {
                    for (let i = 0; i < info.item.items_in_set.length; i++) {
                        let subItem = info.item.items_in_set[i];
                        let title = subItem.en.item_name;
                        let text = `[View Market](https://warframe.market/items/${subItem.url_name})`;
                        let subavg = undefined;

                        if (!subItem.set_root) {
                            try {
                                let subPrices = (await superagent.get(`https://api.warframe.market/v1/items/${subItem.url_name}/statistics`)).body.payload;
                                let subOrders = (await superagent.get(`https://api.warframe.market/v1/items/${subItem.url_name}/orders`)).body.payload.orders;
                                subavg = calc_avg(subPrices.statistics_closed['90days'], subOrders);
                            } catch (e) {
                                console.log(e);
                            }
                            if (subavg !== undefined) {
                                text = `Average: ${subavg.averageAVG.toFixed(0)} <:vaportrader:757350560755089460>\nHigh: ${subavg.highAVG.toFixed(0)} <:platinum:752799138323628083>\nLow: ${subavg.lowAVG.toFixed(0)} <:platinum:752799138323628083>\n` + text
                                embed.addField(title, text, true);
                            }
                        }
                    }
                }
                embed.setThumbnail(`https://warframe.market/static/assets/${info.item.items_in_set[0].icon}`);
                let prices = (await superagent.get(`https://api.warframe.market/v1/items/${item.url_name}/statistics`)).body.payload;
                let orders = (await superagent.get(`https://api.warframe.market/v1/items/${item.url_name}/orders`)).body.payload.orders;
                averages = calc_avg(prices.statistics_closed['90days'], orders);
                if (modMode) {
                    let levels = {};
                    orders.forEach(order => {
                        if (levels[order.mod_rank] === undefined) levels[order.mod_rank] = {
                            buyers: 0,
                            sellers: 0,
                            orders: [],
                            prices: []
                        };
                        if (order.order_type === "sell") {
                            levels[order.mod_rank].sellers += 1;
                        } else {
                            levels[order.mod_rank].buyers += 1;
                        }
                        levels[order.mod_rank].orders.push(order)
                        levels[order.mod_rank].prices.push({
                            max_price: order.platinum,
                            min_price: order.platinum,
                            avg_price: order.platinum
                        });
                    })
                    Object.keys(levels).forEach(level => {
                        let lvlaverages = calc_avg(levels[level].prices, levels[level].orders);
                        if (level === "undefined") level = "MAX";
                        let rankText = `Average: ${lvlaverages.averageAVG.toFixed(0)} <:vaportrader:757350560755089460>\nHigh: ${lvlaverages.highAVG.toFixed(0)} <:platinum:752799138323628083>\nLow: ${lvlaverages.lowAVG.toFixed(0)} <:platinum:752799138323628083>\nBuyers: ${formatNo(lvlaverages.buyVolumeTotal)}\nSellers: ${formatNo(lvlaverages.sellVolumeTotal)}\nUtilization*: ${formatNo(lvlaverages.marketCap.toFixed(0))}%\nPrice Trend: ${lvlaverages.ninetyDayTrend}`
                        if (rankText.includes('Infinity%')) {
                            rankText = rankText.split('Infinity%').join('Infinite');
                        }
                        embed.addField(`Rank: ${level}`, rankText, true);
                    })
                }
            } catch
                (e) {
                console.log("encountered an error getting item price history", e);
                text += "\n:exclamation: Had problems fetching most recent price data :exclamation:";
            }
            embed.setFooter("* The utilization of buyers, by the sellers (how well do the sellers supply the demands of buyers)\nThese prices may not always be attainable prices on the market, they are averages of the orders currently listing this item")

            if (averages !== undefined) {
                item.avg_price = averages.averageAVG;
                item.highest_price = averages.highAVG;
                item.lowest_price = averages.lowAVG;
                text = `90 day average: ${item.avg_price.toFixed(0)} <:vaportrader:757350560755089460>\n90 day high: ${item.highest_price.toFixed(0)} <:platinum:752799138323628083>\n90 day low: ${item.lowest_price.toFixed(0)} <:platinum:752799138323628083>\nOrders (buy/sell): ${formatNo(averages.buyVolumeTotal)} / ${formatNo(averages.sellVolumeTotal)}\nSupply % of demand: ${formatNo(averages.marketCap.toFixed(0))}%\nPrice Trend: ${averages.trend}\nPrice Trend (90 days): ${averages.ninetyDayTrend}\n[View on warframe.market](https://warframe.market/items/${item.url_name})`
                if (text.includes('Infinity%')) {
                    text = text.split('Infinity%').join('Infinite');
                }
            }

            embed.setDescription("__**Overall Statistics:**__\n" + text);

            message.channel.send(embed)
            message.channel.stopTyping()
        }
        ;
    }
    ,
    preflight: (message, args, client, dbm) => {
        return true;
    }
}


function calc_avg(prices, orders) {
    let trend = ":no_entry:";
    let trends = {
        up: 0,
        down: 0,
        none: 0,
    }
    let last_avg = 0.00;
    let highTotal = 0.00;
    let lowTotal = 0.00;
    let averageTotal = 0.00;
    let sellVolumeTotal = 0;
    let buyVolumeTotal = 0;
    prices.forEach(price => {
        highTotal += price.max_price;
        lowTotal += price.min_price;
        averageTotal += price.avg_price;
        if (price.avg_price > last_avg) {
            trend = ":arrow_up:";
            trends.up += 1;
        } else if (price.avg_price === last_avg) {
            trend = ":no_entry:";
            trends.none += 1;
        } else {
            trend = ":arrow_down:";
            trends.down += 1;
        }
        last_avg = price.avg_price;
    })
    orders.forEach(order => {
        if (order.order_type === "sell") {
            sellVolumeTotal += order.quantity;
        } else {
            buyVolumeTotal += order.quantity;
        }
    })
    let highAVG = highTotal / prices.length;
    if (Number.isNaN(highAVG)) highAVG = 0;
    let lowAVG = lowTotal / prices.length;
    if (Number.isNaN(lowAVG)) lowAVG = 0;
    let averageAVG = averageTotal / prices.length;
    if (Number.isNaN(averageAVG)) averageAVG = 0;
    let marketCap = sellVolumeTotal / buyVolumeTotal * 100;
    if (Number.isNaN(marketCap)) marketCap = 0;
    let ninetyDayTrend = ":no_entry:";
    if (trends.up > trends.down && trends.up > trends.none) {
        ninetyDayTrend = ":arrow_up:"
    } else if (trends.down > trends.up && trends.down > trends.none) {
        ninetyDayTrend = ":arrow_down:"
    } else if (trends.none > trends.up && trends.none > trends.down) {
        ninetyDayTrend = ":no_entry:"
    }
    return {highAVG, lowAVG, averageAVG, sellVolumeTotal, buyVolumeTotal, marketCap, trend, ninetyDayTrend}
}

function formatNo(x) {
    let parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}