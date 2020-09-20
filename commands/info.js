const Discord = require('discord.js');
const superagent = require('superagent');

module.exports = {
    name: "info",
    aliases: ["i"],
    description: "Information about the bot",
    help: (message, client) => {
        let embed = new Discord.MessageEmbed()
            .setColor("#c06ed9")
            .setTitle(module.exports.name)
            .setDescription(module.exports.description)
            .addField("Aliases:", `\`${module.exports.name}\` \`${module.exports.aliases.join("`, `")}\``)
        message.channel.send(embed)
    },
    run: async (message, args, client, dbm) => {
        let embed = new Discord.MessageEmbed()
            .setColor("#c06ed9")
            .setTitle(`Information`)
            .setDescription(`Servers: ${formatNo(client.guilds.cache.size)}
            Commands Completed: ${formatNo(client.commandsRan)}
            Latency: Calculating ms
            
            This bot is not affiliated with Digital Extremes:tm: or warframe.market:copyright:`);
        message.channel.send(embed).then(async(m1) => {
            embed.setDescription(`Servers: ${formatNo(client.guilds.cache.size)}
            Commands Completed: ${formatNo(client.commandsRan)}
            Latency: ${formatNo(m1.createdTimestamp - message.createdTimestamp)} ms
            Tradable Items: ${formatNo(await dbm.countItems())}
            Developed by: Altrius#0420
            Version: ${client.botVersion}
            
            [Invite Link](https://discord.com/api/oauth2/authorize?client_id=752258474695590019&permissions=289792&scope=bot)
            
            This bot is not affiliated with Digital Extremes:tm: or warframe.market:copyright:`);
            m1.edit(embed);
        });
    },
    preflight: (message, args, client, dbm) => {
        return true;
    }
}

function formatNo(x) {
    let parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}