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
    help: (message, client, config, pack) => {
        let embed = new Discord.MessageEmbed()
            .setColor(config.theme)
            .setTitle(info.name)
            .setDescription(info.description.split("$$PREFIX").join(config.prefix))
            .addField("Aliases:", `\`${info.name}\`, \`${info.aliases.join("`, `")}\``)
        message.channel.send(embed)
    },
    run: async (pack, message, args, client, dbm) => {
        let embed = new Discord.MessageEmbed()
            .setColor(config.theme)
            .setTitle(pack.commands.info.title)
            .setDescription(pack.commands.info.temp);
        message.channel.send(embed).then(async (m1) => {
            let description = pack.commands.info.description.replace("$VERSION", config.version);
            description = description.replace("$SERVER_COUNT", formatNo(client.guilds.cache.size))
            description = description.replace("$LATENCY", formatNo(m1.createdTimestamp - message.createdTimestamp))
            description = description.replace("$ITEM_COUNT", formatNo(await dbm.countItems()))
            description = description.replace("$USER_CACHE", formatNo(client.users.cache.size))
            dbm.pool.query(`SELECT COUNT(id) FROM general.user_config WHERE ingame_name IS NOT NULL`, (err, data) => {
                if (err) throw err;
                description = description.replace("$USERS_VERIFIED", formatNo(data.rows[0].count));
                embed.setDescription(description);
                m1.edit(embed);
            })
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
