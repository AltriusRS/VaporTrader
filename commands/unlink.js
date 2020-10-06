const Discord = require('discord.js');
const info = {
    name: "unlink",
    aliases: [],
    public: false,
    description: `Unlink your Warframe Market and Discord accounts`,
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
        let embed = new Discord.MessageEmbed()
            .setColor(config.theme)
            .setTitle("Account Unlinked")
            .setDescription(`Your account has been fully unlinked from your Discord user. You can re-link your account by using \`${config.prefix}verify\` at any time.`);
        dbm.pool.query(`UPDATE general.user_config SET code = NULL, wfm_id = NULL, ingame_name = NULL WHERE id = ${message.author.id}`, (err, data) => {
            if (err) throw err;
            message.author.send(embed);
        });
    },
    preflight: (message, args, client, dbm) => {
        return true;
    }
}