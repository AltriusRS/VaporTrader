const Discord = require('discord.js');

const info = {
    name: "wts",
    aliases: [],
    public: true,
    description: "subscribe to a seller price alert"
}

module.exports = {
    name: info.name,
    aliases: info.aliases,
    public: info.public,
    description: info.description,
    help: (message, client, config, pack) => {
        let embed = new Discord.MessageEmbed()
            .setColor("#c06ed9")
            .setTitle(info.name)
            .setDescription(info.description.split("$$PREFIX").join(config.prefix))
            .addField("Aliases:", `\`${info.name}\`, \`${info.aliases.join("`, `")}\``)
        message.channel.send(embed)
    },
    run: async (pack, message, args, client, dbm) => {
        let threshold = parseInt(args.pop());
        let success = await dbm.subscribePriceAlert(message.author, args.join('_').toLowerCase(), threshold, false)
        if (success.passed) {
            let embed = new Discord.MessageEmbed()
                .setColor("#c06ed9")
                .setTitle(pack.commands.startAlert.title)
                .setDescription(pack.commands.startAlert.description)
            message.channel.send(embed)
        } else {
            console.log(success.reason);
        }
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