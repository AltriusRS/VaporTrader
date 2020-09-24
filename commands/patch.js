const Discord = require('discord.js');
const owner = require('../config.json').ownerID
const info = {
    name: "patch",
    aliases: [],
    public: false,
    description: "Reboot the bot from the ground up, full restart"
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
        process.exit();
    },
    preflight: (message, args, client, dbm) => {
        if(message.author.id === owner) {
            process.exit();
        } else {
            console.log(`${message.author} tried resetting the bot, maybe this was intentional?`)
        }
    }
    }