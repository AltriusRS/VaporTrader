const fs = require('fs');
const dbm = require('./database');
const config = require('../config.json');
let commands = {}
readComs()

async function handle(message, client) {
    if (message.author.bot) return;
    if (message.content.toLocaleLowerCase().startsWith(config.prefix)) {
        message.content = message.content.split(config.prefix).join("");
        let args = message.content.split(" ");
        let command = args.shift().toLowerCase();
        let cmd = commands[command];
        if (cmd !== null && cmd !== undefined) {
            if (cmd.preflight(message, args, client, dbm)) {
                try {
                    if (args[0]) {
                        if (args[0].toLowerCase() === "help" || args[0].toLowerCase() === "h") {
                            cmd.help(message, client, config);
                        } else {
                            cmd.run(message, args, client, dbm, commands, config);
                            client.emit("commandSuccess123");
                        }
                    } else {
                        cmd.run(message, args, client, dbm, commands, config);
                        client.emit("commandSuccess123");
                    }
                } catch (e) {
                    console.log(e);
                }
            }
        } else if(command == "reload" && message.author.id === config.ownerID){
            commands = {};
            readComs();
            message.react(client.emojis.resolve("409802959556182026"));
        }
    }
}

module.exports = handle


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