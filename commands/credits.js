const Discord = require('discord.js');
const superagent = require('superagent');
const info = {
    name: "credits",
    aliases: ["c"],
    public: true,
    description: "The people who made this bot possible"
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
            .setTitle(`Credits`)
            .setDescription(`These awesome people are all the ones you should really be thanking for making this bot possible, without their help, feedback, and suggestions this bot would not be anywhere close to as good as it has become.`)
            .addField("Emoji and Icons:", "REAPER_corp#8846", true)
            .addField("Design:", "Broken Cinder#2467\nZane#8888\nthefunniman#2388\nAshghj#6951\nSourdough#1759", true)
            .addField("Backend:", "The whole 42Bytes team for having an amazing API for me to draw data from.", true)
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