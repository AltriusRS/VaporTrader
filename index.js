const handle = require('./modules/command_handler');
const Discord = require('discord.js');
const client = new Discord.Client();
client.commandsRan = 0;
client.botVersion = "0.1.8"
client.login("NzUyMjU4NDc0Njk1NTkwMDE5.X1VBTA.QVxbAaOFp-Wqmtm-rrYFAnsMXQY");

client.once('ready', () => {
    console.log("PriceSpy is ready")
    client.user.setStatus()
})

client.on('message', (message) => {
    handle(message, client)
})

client.on('commandSuccess123', () => {
    client.commandsRan += 1;
})