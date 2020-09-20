const Discord = require('discord.js');
const superagent = require('superagent');

module.exports = {
    name: "search",
    aliases: ["fs", "fuzzy"],
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
        let search_results = await dbm.fuzzy_search_item(args.join(" "));
        if (search_results[0] === undefined) return;

        let embed = new Discord.MessageEmbed()
            .setColor("#c06ed9")
            .setTitle("Search Results")
            .setFooter("These prices are not indicative of current trade value, they are averages over a 3 month period.\nPlease keep this in mind.");
        if (search_results.length > 9) {
            embed.setDescription(`Your search for \`${args.join(" ")}\` returned ${search_results.length} results, showing results 1 - 9`);
        } else {
            embed.setDescription(`Your search for \`${args.join(" ")}\` returned ${search_results.length} results`);
        }
        for (let i = 0; i < search_results.length; i++) {
            let result = search_results[i];
            if (i < 9) {
                let text = `90 day average: ${result.avg_price.toFixed(0)} <:vaportrader:757350560755089460>\n90 day high: ${result.highest_price.toFixed(0)} <:platinum:752799138323628083>\n90 day low: ${result.lowest_price.toFixed(0)} <:platinum:752799138323628083>\n[View on warframe.market](https://warframe.market/items/${result.url_name})`;
                embed.addField(`${result.item_name}`, text, true)
            }
        }

        message.channel.send(embed);
    },
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