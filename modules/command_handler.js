const fs = require('fs');
const dbm = require('./database');
const commands = {}
readComs()

async function handle(message, client) {
    if (message.author.bot) return;
    if (message.content.toLocaleLowerCase().startsWith('ps!')) {
        message.content = message.content.split("ps!").join("");
        let args = message.content.split(" ");
        let command = args.shift().toLowerCase();
        let cmd = commands[command];
        if (cmd !== null && cmd !== undefined) {
            if (cmd.preflight(message, args, client, dbm)) {
                cmd.run(message, args, client, dbm);
            }
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