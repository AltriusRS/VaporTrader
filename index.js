const fs = require('fs');
const discord = require('discord.js');
const client = new discord.Client()
const dbm = require('./modules/database.js');
const commands = require('./modules/command_handler.js');
const handler = new commands.Handler(dbm)
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    handler.handle(msg)
});

client.login('NzUyMjU4NDc0Njk1NTkwMDE5.X1VBTA.QVxbAaOFp-Wqmtm-rrYFAnsMXQY');