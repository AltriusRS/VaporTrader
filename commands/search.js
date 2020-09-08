const Discord = require('discord.js');

module.exports = {
    name: "search",
    aliases: ["fs", "fuzzy"],
    description: "A commmand that takes your input and returns a set of items matching your description. example: `ps!search Soma Prime`",
    help: (message, client) => {
        let embed = new Discord.MessageEmbed()
            .setColor("#ffca07")
            .setTitle(module.exports.name)
            .setDescription(module.exports.description)
            .addField("Aliases:", `\`${module.exports.name}\` \`${module.exports.aliases.join("`, `")}\``)
        message.channel.send(embed)
    },
    run: async (message, args, client, dbm) => {
        let search_results = await dbm.fuzzy_search_item(args.join(" "));
        let embed = new Discord.MessageEmbed()
            .setColor("#ffca07")
            .setTitle("Search Results");
        if (search_results.length > 9) {
            embed.setDescription(`Your search for \`${args.join(" ")}\` returned ${search_results.length} results, showing results 1 - 9`);
        } else {
            embed.setDescription(`Your search for \`${args.join(" ")}\` returned ${search_results.length} results`);
        }
        for (let i = 0; i < search_results.length; i++) {
            let result = search_results[i];
            if (i < 9) {
                embed.addField(`${result.item_name}`, `90 day average: ${result.avg_price.toFixed(0)} <:platinum:752799138323628083>\n90 day high: ${result.highest_price.toFixed(0)} <:platinum:752799138323628083>\n90 day low: ${result.lowest_price.toFixed(0)} <:platinum:752799138323628083>\n[View on warframe.market](https://warframe.market/items/${result.url_name})`, true)
            }
        }

        message.channel.send(embed);
    },
    preflight: (message, args, client, dbm) => {
        return true;
    }
}