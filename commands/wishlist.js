const Discord = require('discord.js');
const superagent = require('superagent');
const info = {
    name: "newlist",
    aliases: ["nl"],
    public: false,
    description: "Creates a new wishlist linked to your discord user"
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
        let name = args.join(" ");
        let owner = message.author;
        let link = Math.random().toString(36).slice(5).toUpperCase();
        let embed = new Discord.MessageEmbed()
            .setColor("#c06ed9")
            .setTitle(name)
            .setDescription(`Code: ${link}\nOwner: ${owner.username}`);
        message.channel.send(embed);
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