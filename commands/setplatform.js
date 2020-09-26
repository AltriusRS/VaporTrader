const Discord = require('discord.js');

const info = {
    name: "sp",
    aliases: [],
    public: true,
    description: "set your platform (pc/xbox/ps4/switch)"
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
        let embed = new Discord.MessageEmbed()
            .setColor("#c06ed9")
        if (["pc", "ps4", "xbox", "switch"].includes(args[0].toLowerCase())) {
            let success = await dbm.setUserPlatform(message.author, args[0].toLowerCase())
            if (success.passed) {
                embed
                    .setTitle(pack.commands.setPlatform.title)
                    .setDescription(pack.commands.setPlatform.description)
                message.channel.send(embed)
            } else {
                console.log(success.reason);
            }
        } else {
            embed.setTitle(pack.commands.setPlatform.errors.unRecognizedPlatform.title)
                .setDescription(pack.commands.setPlatform.errors.unRecognizedPlatform.description.replace("$PLATFORM", args[0]))
            message.channel.send(embed)
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