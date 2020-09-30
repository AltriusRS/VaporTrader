const Discord = require('discord.js');
const axios = require('axios');
const config = require('../config.json')
const info = {
    name: "price",
    aliases: ["p", "prices"],
    public: true,
    description: `A commmand that provides detailed information about the current state of an item in the warframe market.\nExample: \`$$PREFIXprice Soma Prime\``,
}

module.exports = {
    name: info.name,
    aliases: info.aliases,
    public: info.public,
    description: info.description,
    help: (message, client, config, pack) => {
        let embed = new Discord.MessageEmbed()
            .setColor("#c06ed9")
            .setTitle(info.name)
            .setDescription(info.description.split("$$PREFIX").join(config.prefix))
            .addField("Aliases:", `\`${info.name}\`, \`${info.aliases.join("`, `")}\``)
        message.channel.send(embed)
    },
    run: async (pack, message, args, client, dbm) => {
        message.channel.startTyping()
        let items = [];
        let ag = args.join(" ");
        if (ag.includes(",")) {
            items = ag.split(", ");
        }
        if (items.length > 5) {
            await message.channel.send("Cannot Query more than 5 items at a time")
            await message.channel.stopTyping()
        } else {
            if (items.length === 0) items.push(ag);
            let embeds = [];
            for (let n = 0; n < items.length; n++) {
                let pi = items[n];
                let search_results = await dbm.findItemByName(pi.split("\'").join("\\'"));
                let item = search_results[0];

                if (item === undefined) {
                    message.channel.send("Unknown Item: ` " + pi + "`")
                    message.channel.stopTyping()
                } else {
                    if (!item.name_en.includes('Set')) {
                        for (var i = 0; i < search_results.length; i++) {
                            let s = search_results[i];
                            if (s.name_en.includes('Set')) {
                                item = s;
                            }
                        }
                    }
                    let embed = new Discord.MessageEmbed()
                        .setColor("#c06ed9")
                        .setTitle(`Price Information - ${item.name_en}`)
                        .setFooter("These prices may not always be attainable prices on the market, they are averages of the orders currently listing this item");

                    let text = `90 day average: N/A\n90 day high: N/A\n90 day low: N/A\n[View on warframe.market](https://warframe.market/items/${item.url_name})`;
                    let modMode = false;
                    let averages = undefined;

                    try {
                        let info = (await axios.get(`https://api.warframe.market/v1/items/${item.url_name}`)).data.payload;
                        embed.setThumbnail(`https://warframe.market/static/assets/${info.item.items_in_set[0].icon}`);
                        let prices = (await axios.get(`https://api.warframe.market/v1/items/${item.url_name}/statistics`)).data.payload;
                        let orders = (await axios.get(`https://api.warframe.market/v1/items/${item.url_name}/orders`)).data.payload.orders;
                        averages = calc_avg(prices.statistics_closed['90days'], orders);
                        let sub_totals = {
                            totalAVG: 0,
                            totalHigh: 0,
                            totalLow: 0
                        };
                        if (info.item.items_in_set[0].tags.includes('mod')) modMode = true;
                        if (info.item.items_in_set.length > 1) {
                            for (let i = 0; i < info.item.items_in_set.length; i++) {
                                let subItem = info.item.items_in_set[i];
                                let title = subItem.en.item_name;
                                let text = `[View Market](https://warframe.market/items/${subItem.url_name})`;
                                let subavg = undefined;
                                if (!subItem.set_root) {
                                    try {
                                        let subPrices = (await axios.get(`https://api.warframe.market/v1/items/${subItem.url_name}/statistics`)).data.payload;
                                        let subOrders = (await axios.get(`https://api.warframe.market/v1/items/${subItem.url_name}/orders`)).data.payload.orders;
                                        subavg = calc_avg(subPrices.statistics_closed['90days'], subOrders);
                                        sub_totals.totalAVG += subavg.averageAVG;
                                        sub_totals.totalHigh += subavg.highAVG;
                                        sub_totals.totalLow += subavg.lowAVG;
                                    } catch (e) {
                                        console.log(e);
                                    }
                                    if (subavg !== undefined) {
                                        text = `Average: ${subavg.averageAVG.toFixed(0)} <:vaportrader:757687668522877009>\nHigh: ${subavg.highAVG.toFixed(0)} <:platinum:757676262708871257>\nLow: ${subavg.lowAVG.toFixed(0)} <:platinum:757676262708871257>\n` + text
                                        embed.addField(title, text, true);
                                    }
                                }
                            }
                            let savings = averages.lowAVG - sub_totals.totalLow;
                            if (savings < averages.averageAVG - sub_totals.totalAVG) savings = averages.averageAVG - sub_totals.totalAVG;
                            if (savings < averages.highAVG - sub_totals.totalHigh) savings = averages.highAVG - sub_totals.totalHigh;

                            embed.addField("Component Cost", `Average: ${sub_totals.totalAVG.toFixed(0)} <:vaportrader:757687668522877009>\nHighest: ${sub_totals.totalHigh.toFixed(0)} <:platinum:757676262708871257>\nLowest: ${sub_totals.totalLow.toFixed(0)} <:platinum:757676262708871257>\nYou save up to: ${savings.toFixed(0)} <:vaportrader:757687668522877009>`, false);
                        }
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
                                let rankText = `Average: ${lvlaverages.averageAVG.toFixed(0)} <:vaportrader:757687668522877009>\nHigh: ${lvlaverages.highAVG.toFixed(0)} <:platinum:757676262708871257>\nLow: ${lvlaverages.lowAVG.toFixed(0)} <:platinum:757676262708871257>\nBuyers: ${formatNo(lvlaverages.buyVolumeTotal)}\nSellers: ${formatNo(lvlaverages.sellVolumeTotal)}\nUtilization*: ${formatNo(lvlaverages.marketCap.toFixed(0))}%\nPrice Trend: ${lvlaverages.ninetyDayTrend}`
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
                        text = `90 day average: ${item.avg_price.toFixed(0)} <:vaportrader:757687668522877009>\n90 day high: ${item.highest_price.toFixed(0)} <:platinum:757676262708871257>\n90 day low: ${item.lowest_price.toFixed(0)} <:platinum:757676262708871257>\nOrders (buy/sell): ${formatNo(averages.buyVolumeTotal)} / ${formatNo(averages.sellVolumeTotal)}\nUtilization*: ${formatNo(averages.marketCap.toFixed(0))}%\nPrice Trend: ${averages.trend}\nPrice Trend (90 days): ${averages.ninetyDayTrend}\n[View on warframe.market](https://warframe.market/items/${item.url_name})`
                        if (text.includes('Infinity%')) {
                            text = text.split('Infinity%').join('Infinite');
                        }
                    }

                    embed.setDescription(`__**Overall Statistics:**__\n` + text);

                    embeds.push(embed);
                    if((items.length - n) > 1){
                        await sleep(1000);
                    }
                }
            }
            for (let o = 0; o < embeds.length; o++) {
                await message.channel.send(embeds[o]);
            }
            await message.channel.stopTyping();
        }
    },
    preflight: (message, args, client, dbm) => {
        return true;
    }
}


function calc_avg(prices, orders) {
    let trend = "<:no_change:757557475246473276>";
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
            trend = "<:trend_up:757557475192078386>";
            trends.up += 1;
        } else if (price.avg_price === last_avg) {
            trend = "<:no_change:757557475246473276>";
            trends.none += 1;
        } else {
            trend = "<:trend_down:757557475355394058>";
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
    let ninetyDayTrend = "<:no_change:757557475246473276>";
    if (trends.up > trends.down && trends.up > trends.none) {
        ninetyDayTrend = "<:trend_up:757557475192078386>"
    } else if (trends.down > trends.up && trends.down > trends.none) {
        ninetyDayTrend = "<:trend_down:757557475355394058>"
    } else if (trends.none > trends.up && trends.none > trends.down) {
        ninetyDayTrend = "<:no_change:757557475246473276>"
    }
    return {highAVG, lowAVG, averageAVG, sellVolumeTotal, buyVolumeTotal, marketCap, trend, ninetyDayTrend}
}

function formatNo(x) {
    let parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
