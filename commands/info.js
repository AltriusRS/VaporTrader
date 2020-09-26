const Discord = require('discord.js');
const info = {
    name: "info",
    aliases: ["i"],
    public: true,
    description: "Information about the bot"
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
        let embed = new Discord.MessageEmbed()
            .setColor("#c06ed9")
            .setTitle(`Information`)
            .setDescription(`Servers: ${formatNo(client.guilds.cache.size)}\nLatency: Calculating ms\nThis bot is not affiliated with Digital Extremes:tm: or warframe.market:copyright:`);

        message.channel.send(embed).then(async (m1) => {
            embed.setDescription(`Servers: ${formatNo(client.guilds.cache.size)}\nLatency: ${formatNo(m1.createdTimestamp - message.createdTimestamp)} ms\nTradable Items: ${formatNo(await dbm.countItems())}\nDeveloped by: Altrius#0420\nVersion: ${client.botVersion}\n[Invite Link](https://discord.com/api/oauth2/authorize?client_id=752258474695590019&permissions=289792&scope=bot)\n[Source Code](https://github.com/fatalcenturion/VaporTrader)\nThis bot is not affiliated with Digital Extremes:tm: or warframe.market:copyright:`);
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
    return parts.join(",");
}