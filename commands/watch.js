const Discord = require('discord.js');
const info = {
    name: "watch",
    aliases: [],
    public: false,
    description: `watch your account for new orders, and provide feedback and potential fulfillments upon arrival`,
}

module.exports = {
    name: info.name,
    aliases: info.aliases,
    public: info.public,
    description: info.description,
    help: (pack, message, client, config) => {
        let embed = new Discord.MessageEmbed()
            .setColor(config.theme)
            .setTitle(info.name)
            .setDescription(info.description.split("$$PREFIX").join(config.prefix))
            .addField("Aliases:", `\`${info.name}\`, \`${info.aliases.join("`, `")}\``)
        message.channel.send(embed)
    },
    run: async (pack, message, args, client, dbm) => {
        dbm.pool.query(`SELECT watching, wfm_id, ingame_name, id from general.user_config WHERE id = ${message.author.id}`, (err, data) => {
            if (err) throw err;
            let u = data.rows[0];
            dbm.pool.query(`UPDATE general.user_config SET watching = ${!u.watching} WHERE id = ${message.author.id}`, (err, data) => {
                if (err) throw err;
                let embed = new Discord.MessageEmbed()
                    .setColor(config.theme)
                    .setTitle(pack.commands.watch.success.title)
                    .setDescription(pack.commands.watch.success.description.replace("$PREFIX", config.prefix));
                if (!u.watching === true) embed.setTitle(pack.commands.watch.success.titleWatching);
                message.channel.send(embed);
            });
        });
    },
    preflight: (message, args, client, dbm) => {
        return true;
    }
}