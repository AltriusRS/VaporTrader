const crypto = require('crypto');
const Discord = require('discord.js');
const info = {
    name: "verify",
    aliases: ["vf"],
    public: true,
    description: `Link your Warframe Market and Discord accounts`,
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
        let md5sum = crypto.createHash('md5');
        md5sum.update(`${message.author.id}${message.channel.id}${message.id}${message.createdTimestamp}`);
        let embed = new Discord.MessageEmbed()
            .setColor("#c06ed9")
            .setTitle(pack.commands.verify.title)
        let code = shorten(md5sum.digest('hex'), 12);
        embed.setDescription(pack.commands.verify.description);
        embed.addField(pack.commands.verify.fieldTitle, code, true);
        dbm.pool.query(`UPDATE general.user_config SET code = '${code}' WHERE id = ${message.author.id}`, (err, data) => {
            if (err) throw err;
            message.author.send(embed);
        });
    },
    preflight: (message, args, client, dbm) => {
        return true;
    }
}

function shorten(available, length) {
    let text = "";
    for (var i = 0; i < length; i++)
        text += available.charAt(Math.floor(Math.random() * available.length));
    return text
}