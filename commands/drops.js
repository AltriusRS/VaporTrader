const Discord = require('discord.js');
const superagent = require('superagent');
const config = require('../config.json')
const info = {
    name: "drops",
    aliases: ["d", "drop"],
    public: true,
    description: `Helps find known drop sources for an item.\nExample: \`$$PREFIXdrops Ninkondi Prime Chain\``,
}

module.exports = {
    name: info.name,
    aliases: info.aliases,
    public: info.public,
    description: info.description,
    help: (message, client, config) => {
        let embed = new Discord.MessageEmbed()
            .setColor("#c06ed9")
            .setTitle(info.name)
            .setDescription(info.description.split("$$PREFIX").join(config.prefix))
            .addField("Aliases:", `\`${info.name}\`, \`${info.aliases.join("`, `")}\``)
        message.channel.send(embed)
    },
    run: async (message, args, client, dbm) => {
        let search_results = await dbm.fuzzy_search_item(args.join(" "));
        if (search_results[0] === undefined) return;
        let item = search_results[0];

        let embed = new Discord.MessageEmbed()
            .setColor("#c06ed9")
            .setTitle("Drops")
            .setThumbnail(`https://warframe.market/static/assets/${item.icon}`);
        if (item.drops.length > 0) {
            embed.setDescription(`The ${item.item_name} is dropped by:`);
            for (let i=0; i<item.drops.length; i++) {
                let drop = item.drops[i];
                if (embed.fields.length > 9) return;
                if (containsAny(drop.name, ["Neo", "Meso", "Axi", "Lith", "Requiem"])) {
                    let name = drop.name.split(" ");
                    let tier = name.pop();
                    let relicName = name.join(" ")
                    let vaulted = await dbm.checkRelic(relicName);
                    if (vaulted) {
                        embed.addField(`Relic: ${relicName}`, `:warning: Vaulted Relic\nTier: ${tier}\n[View on Market](https://warframe.market/items/${relicName.toLocaleLowerCase().split(" ").join("_")}_intact)`, true);
                    } else {
                        embed.addField(`Relic: ${relicName}`, `Tier: ${tier}\n[View on Market](https://warframe.market/items/${relicName.toLocaleLowerCase().split(" ").join("_")}_intact)`, true);
                    }
                } else {
                    embed.addField("Other?", drop.name, true);
                }
            }
        } else {
            embed.setDescription("This item doesnt seem to have any drops we know of, maybe try another one?");
        }

        message.channel.send(embed);
    },
    preflight: (message, args, client, dbm) => {
        return true;
    }
}

function formatNo(x) {
    let parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(",");
}


function containsAny(str, substrings) {
    for (var i = 0; i != substrings.length; i++) {
        var substring = substrings[i];
        if (str.indexOf(substring) != -1) {
            return true;
        }
    }
    return false;
}