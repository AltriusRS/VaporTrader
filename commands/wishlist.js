const Discord = require('discord.js');
const superagent = require('superagent');

module.exports = {
    name: "newlist",
    aliases: ["nl"],
    description: "Creates a new wishlist linked to your discord user",
    help: (message, client) => {
        let embed = new Discord.MessageEmbed()
            .setColor("#c06ed9")
            .setTitle(module.exports.name)
            .setDescription(module.exports.description)
            .addField("Aliases:", `\`${module.exports.name}\` \`${module.exports.aliases.join("`, `")}\``)
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