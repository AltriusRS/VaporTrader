const Discord = require('discord.js');

const info = {
    name: "help",
    aliases: ["h"],
    public: true,
    description: "A helpful command"
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
    run: async (pack, message, args, client, dbm, commands, config) => {
        let embed = new Discord.MessageEmbed()
            .setColor(config.theme)
            .setTitle(`Help`)
            .setDescription(`Quick Info:\nPrefix: \`${config.prefix}\`\nUse: \`${config.prefix}<command> help\` to get detailed information about the command`);
        let fullcomms = {};
        let keys = Object.keys(commands)

        for (let i = 0; i < keys.length; i++) {
            let key = commands[keys[i]];
            if (fullcomms[key.name] === undefined) fullcomms[key.name] = key;
        }

        let coms = Object.keys(fullcomms)
        coms = coms.sort()
        for (let i = 0; i < coms.length; i++) {
            let key = fullcomms[coms[i]];
            if (key.public) {
                embed.addField(key.name, `${key.description.split("$$PREFIX").join(config.prefix)}`, true)
            }
        }

        message.channel.send(embed)
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
