const Discord = require('discord.js');
const info = {
    name: "search",
    aliases: ["s", "f"],
    public: true,
    description: `A commmand that takes your input and returns a set of items matching your description.\nExample: \`$$PREFIXsearch Soma Prime\``,
}

module.exports = {
    name: info.name,
    aliases: info.aliases,
    public: info.public,
    description: info.description,
    help: (message, client, config, pack) => {
        let embed = new Discord.MessageEmbed()
            .setColor(config.theme)
            .setTitle(info.name)
            .setDescription(info.description.split("$$PREFIX").join(config.prefix))
            .addField("Aliases:", `\`${info.name}\`, \`${info.aliases.join("`, `")}\``)
        message.channel.send(embed)
    },
    run: async (pack, message, args, client, dbm) => {
        let search_results = await dbm.findItemByName(args.join(" "));
        if (search_results[0] === undefined) {
            message.channel.send(`Unknown Item: \`${args.join(" ")}\``);
            return
        };

        let embed = new Discord.MessageEmbed()
            .setColor(config.theme)
            .setTitle(pack.commands.search.title)
            .setFooter(pack.commands.search.footer);
        if (search_results.length > 9) {
            embed.setDescription(pack.commands.search.descriptions.moreThan9.replace("$SEARCH_TERM", args.join(" ")).replace("$RESULT_COUNT", search_results.results.length));
        } else {
            embed.setDescription(pack.commands.search.descriptions.lessThan9.replace("$SEARCH_TERM", args.join(" ")).replace("$RESULT_COUNT", search_results.results.length));
        }
        for (let i = 0; i < search_results.results.length; i++) {
            let result = search_results.results[i];
            if (i < 9) {
                let text = "Prices (temporarily) unavailable"//`90 day average: ${result.avg_price.toFixed(0)} <:vaportrader:757350560755089460>\n90 day high: ${result.highest_price.toFixed(0)} <:platinum:752799138323628083>\n90 day low: ${result.lowest_price.toFixed(0)} <:platinum:752799138323628083>\n[View on warframe.market](https://warframe.market/items/${result.url_name})`;
                embed.addField(`${result.name_en}`, text, true)
            }
        }

        message.channel.send(embed);
    },
    preflight: (message, args, client, dbm) => {
        return true;
    }
}
