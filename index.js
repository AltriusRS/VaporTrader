const config = require('./config.json')
const handle = require('./modules/command_handler');
const Discord = require('discord.js');
const client = new Discord.Client();
client.commandsRan = 0;
client.botVersion = config.version;
client.login(config.token);

client.on('ready', () => {
    console.log("PriceSpy is ready")
    client.user.setPresence({
        game: {
            name: 'with the market',
            type: "PLAYING",
        }
    });
})

client.on('message', (message) => {
    handle(message, client)
})

client.on('commandSuccess123', () => {
    client.commandsRan += 1;
})