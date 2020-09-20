const Discord = require('discord.js');
const d3 = require('d3');
const {createCanvas} = require('canvas');

module.exports = {
    name: "prices",
    aliases: ["p"],
    description: "A commmand that takes your input and returns a set of items matching your description. example: `ps!search Soma Prime`",
    help: (message, client) => {
        let embed = new Discord.MessageEmbed()
            .setColor("#ffca07")
            .setTitle(module.exports.name)
            .setDescription(module.exports.description)
            .addField("Aliases:", `\`${module.exports.name}\` \`${module.exports.aliases.join("`, `")}\``)
        message.channel.send(embed)
    },
    run: (message, args, client, dbm) => {
        const svg = d3.create("svg")
            .attr("viewBox", [0, 0, width, height]);

        const rect = svg.selectAll("g")
            .data(y01z)
            .join("g")
            .attr("fill", (d, i) => z(i))
            .selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr("x", (d, i) => x(i))
            .attr("y", height - margin.bottom)
            .attr("width", x.bandwidth())
            .attr("height", 0);

        svg.append("g")
            .call(xAxis);
        dbm.fuzzy_search_item(args.join(" ")).then(search_results => {
            let item = search_results[0];
            if (item !== undefined) {
                let highest_x = 90;
                let all_x = [];
                let trend_high = [];
                let trend_low = [];
                let trend_avg = [];
                while (all_x.length < highest_x) {
                    all_x.push(all_x.length - highest_x);
                }

                for (let i = 0; i < item.prices.length; i++) {
                    let price = item.prices[i];
                    trend_high.push({x: i, y: price.highest_price});
                    trend_low.push({x: i, y: price.lowest_price});
                    trend_avg.push({x: i, y: price.avg_price});
                }
                let data = [{"keys": all_x}, trend_avg, trend_high, trend_low]
                console.log(data)

            }

        });

    },
    preflight: (message, args, client, dbm) => {
        return true;
    }
}