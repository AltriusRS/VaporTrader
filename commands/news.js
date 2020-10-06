const Discord = require('discord.js');
//const superagent = require('axios');
const config = require('../config.json')
const info = {
    name: "news",
    aliases: [],
    public: false,
    description: `Subscribes a user to news pings in the official server`,
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
        if (message.guild.id === "757209873086808105") {
            if (message.member.roles.cache.has("760479913010135051")) {
                await message.member.roles.remove("760479913010135051")
                let embed = new Discord.MessageEmbed()
                    .setColor('#f48a36')
                    .setTitle("Roles Update")
                    .setDescription("You will no longer receive update pings about the bot, subscribe again at any time with `$news`")
                await message.channel.send(embed);
            } else {
                await message.member.roles.add("760479913010135051")
                let embed = new Discord.MessageEmbed()
                    .setColor('#f48a36')
                    .setTitle("Roles Update")
                    .setDescription("You will now receive update pings about the bot, unsubscribe again at any time with `$news`")
                await message.channel.send(embed);

            }

        }
    },
    preflight: (message, args, client, dbm) => {
        return true;
    }
}