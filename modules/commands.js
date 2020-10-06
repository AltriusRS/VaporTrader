const fs = require('fs');
const Discord = require('discord.js');
const config = require('../config.json');
let languagePacks = {}
let commands = {}
readComs()
readPacks()

async function handle(message, client, dbm) {
    if (message.author.bot) return;
    if (message.content.toLocaleLowerCase().startsWith(config.prefix)) {
        message.content = message.content.replace(config.prefix, "");
        let args = message.content.split(" ");
        let command = args.shift().toLowerCase();
        let cmd = commands[command];
        if (cmd !== null && cmd !== undefined) {
            if (cmd.preflight(message, args, client, dbm)) {
                try {
                    let pack = await choosePack(dbm, message.author.id);
                    if (args[0]) {
                        if (args[0].toLowerCase() === "help" || args[0].toLowerCase() === "h") {
                            await cmd.help(message, client, config, pack);
                        } else {
                            await cmd.run(pack, message, args, client, dbm, commands, config);
                        }
                    } else {
                        await cmd.run(pack, message, args, client, dbm, commands, config);
                    }
                } catch (e) {
                    console.log(e);
                    let embed = new Discord.MessageEmbed()
                        .setColor('#aa0000')
                        .setTitle("Error")
                        .setDescription(`\`\`\`${e.stack}\`\`\``)
                    message.channel.send(embed);
                    let cnl = await client.channels.fetch('760620973790986280');
                    embed.setTimestamp(Date.now())
                        .addField("Command", cmd.name, true)
                        .addField("Server", message.guild.name, true)
                        .addField("Member", `${message.author}\n${message.author.id}\n${message.author.username}#${message.author.discriminator}`, true)
                        .addField("Args", args.join(", "), true);
                    await cnl.send(embed);
                }
            }
        } else if ((command == "reload" || command == "rl") && message.author.id === config.ownerID) {
            commands = {};
            readComs();
            readPacks();
            await message.react(client.emojis.resolve("409802959556182026"));
            let cnl = await client.channels.fetch('759720616068382730');
            let embed = new Discord.MessageEmbed()
                .setColor("#FFFF00")
                .setTitle("Automated Reload (Source: Owner)")
                .setDescription(`Reloading....`)
                .addField(`Requested By`, message.author.username)
                .setTimestamp(Date.now())
            await cnl.send(embed);
        } else if (command == "patch" && message.author.id === config.ownerID) {
            let cnl = await client.channels.fetch('759720616068382730');
            let embed = new Discord.MessageEmbed()
                .setColor("#ff5700")
                .setTitle("Automated Patch (Source: Owner)")
                .setDescription(`Automatically applying patch`)
                .addField(`Requested By`, message.author.username)
                .setTimestamp(Date.now())
            await cnl.send(embed);
            process.exit();
        }
    }
}

module.exports.handle = handle;
module.exports.choosePack = choosePack;


function readComs() {
    let files = fs.readdirSync('./commands');
    files.forEach(file => {
        if (file.includes(".js")) {
            let content = fs.readFileSync(`./commands/${file}`, 'utf8');
            let command = eval(content);
            commands[command.name] = command;
            command.aliases.forEach(alias => {
                commands[alias] = command;
            })
        }
    })
}

function readPacks() {
    let files = fs.readdirSync('./translations');
    files.forEach(file => {
        if (file.includes(".json")) {
            let pack = JSON.parse(fs.readFileSync(`./translations/${file}`, 'utf8'))
            languagePacks[file.split('.json')[0]] = pack;
        }
    })
}

async function choosePack(dbm, user) {
    let userConfig = await dbm.getUserConfig({id: user});
    let pack = languagePacks[userConfig.language];
    pack = pack !== undefined ? pack : languagePacks.en;
    return pack;
}