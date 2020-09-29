const Discord = require('discord.js');
const config = require('../config.json');
const ignore = ["forma blueprint"];
const info = {
    name: "relic",
    aliases: ["rd"],
    public: true,
    description: "Information about a relic"
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
    run: async (pack, message, args, client, dbm) => {
        let era = args.shift();
        let name = args.shift();
        let refinement = args[0];
        refinement = refinement !== undefined ? refinement : "Intact";
        let drops = await dbm.getRelic(era, name);
        era = era.split('');
        let embed = new Discord.MessageEmbed()
            .setColor("#c06ed9")
            .setTitle(pack.commands.relic_drops.title)
            .setDescription(pack.commands.relic_drops.description.replace('$RELIC_NAME', `${era.shift().toUpperCase()}${era.join('')} ${name.toUpperCase()}`));
        for (let i = 0; i < drops.length; i++) {
            let tier = drops[i];
            console.log(tier.refinement.toLowerCase(), refinement.toLowerCase(), tier.refinement.toLowerCase() === refinement.toLowerCase());
            if (tier.refinement.toLowerCase() === refinement.toLowerCase()) {
                let title = tier.refinement;
                let description = "__Common (";
                for (let o = 0; o < tier.common.length; o++) {
                    let item = tier.common[o];
                    let info = (await dbm.findItemByName(item.item))[0];
                    if (o === 0) description += `${item.chance}%)__:\n`
                    if (info !== undefined) {
                        if (info.vaulted) {
                            description += ":warning:"
                        }
                    } else if (ignore.includes(item.item.toLowerCase())) {

                    } else {
                        console.log(item);
                        if (item.item.includes("Blueprint")) {
                            info = (await dbm.findItemByName(item.item.split(" Blueprint")[0]))[0];
                            if (info !== undefined) {
                                if (info.vaulted) {
                                    description += ":warning:"
                                } else {
                                    description += ":grey_exclamation:"
                                }
                            } else {
                                description += ":grey_exclamation:"
                            }
                        } else {
                            description += ":grey_exclamation:"
                        }
                    }
                    description += `[${item.item}](https://warframe.market/items/${item.url})\n`
                }
                description += "\n__Uncommon (";
                for (let o = 0; o < tier.uncommon.length; o++) {
                    let item = tier.uncommon[o];
                    let info = (await dbm.findItemByName(item.item))[0];
                    if (o === 0) description += `${item.chance}%)__:\n`

                    if (info !== undefined) {
                        if (info.vaulted) {
                            description += ":warning:"
                        }
                    } else {
                        console.log(item);
                        if (item.item.includes("Blueprint")) {
                            info = (await dbm.findItemByName(item.item.split(" Blueprint")[0]))[0];
                            if (info !== undefined) {
                                if (info.vaulted) {
                                    description += ":warning:"
                                } else {
                                    description += ":grey_exclamation:"
                                }
                            } else {
                                description += ":grey_exclamation:"
                            }
                        } else {
                            description += ":grey_exclamation:"
                        }
                    }
                    description += `[${item.item}](https://warframe.market/items/${item.url})\n`
                }
                description += "\n__Rare (";
                for (let o = 0; o < tier.rare.length; o++) {
                    let item = tier.rare[o];
                    let info = (await dbm.findItemByName(item.item.split(" Blueprint")[0]))[0];
                    if (o === 0) description += `${item.chance}%)__:\n`
                    if (info !== undefined) {
                        if (info.vaulted) {
                            description += ":warning:"
                        }
                    } else {
                        console.log(item);
                        if (item.item.includes("Blueprint")) {
                            info = (await dbm.findItemByName(item.item))[0];
                            if (info !== undefined) {
                                if (info.vaulted) {
                                    description += ":warning:"
                                } else {
                                    description += ":grey_exclamation:"
                                }
                            } else {
                                description += ":grey_exclamation:"
                            }
                        } else {
                            description += ":grey_exclamation:"
                        }
                    }
                    description += `[${item.item}](https://warframe.market/items/${item.url})\n`
                }
                embed.addField(title, description, true)
            }
        }
        await message.channel.send(embed);
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