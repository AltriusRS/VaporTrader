const config = require('./config.json');
const Discord = require('discord.js');
const dbm = (require('./modules/database').new(config));
const client = new Discord.Client({shards: "auto"});
const alertManager = require('./modules/alerts')
let platforms = ["pc", "ps4", "xbox", "switch"];
client.login(config.token);
client.on('ready', () => {
    console.log(`Vapor Trader - ${config.version}\nConnecting to feeds`)
    alertManager.start(platforms, client, dbm);
})

client.on('message', async (message) => {
    if (message.author.bot) return;
    let memberConfig = await dbm.getUserConfig(message.author);
    await memberConfig.getWishLists();
})

client.on('priceAlert', (alerts, info, buy) => {
    let embed = new Discord.MessageEmbed()
        .setColor("#C06ED9")
        .setTitle("Price Alert!")
        .setThumbnail(`https://warframe.market/static/assets/${info.order.item.icon}`)
        .setDescription(`Your price alert on the ${info.order.item.en.item_name} has been triggered!\n\nContact the ${formatBuyer(buy)} with the following message:\n\n\`/whisper ${info.order.user.ingame_name} Hi! I ${formatBuyer2(buy)} ${info.order.item.en.item_name} for ${info.order.platinum} :platinum: (Powered by: Vapor Trader)\``)
        .setFooter("If you got your item successfully, consider cancelling your price alert to stop future messages like this")

    if (((alerts.length) - 1) > 0) {
        if (((alerts.length) - 1) > 1) {
            embed.addField("WARNING", `You are competing against approximately ${((alerts.length) - 1)}  other people for this price alert.`)
        } else {
            embed.addField("WARNING", `You are competing against approximately ${((alerts.length) - 1)}  other person for this price alert.`)
        }
    }

    if (info.order.user.avatar) {
        embed.setAuthor(info.order.user.ingame_name, `https://warframe.market/static/assets/${info.order.user.avatar}`);
    } else {
        embed.setAuthor(info.order.user.ingame_name, "https://warframe.market/static/assets/user/default-avatar.png");
    }

    alerts.forEach(user => {
        let u = client.users.cache.get(user.user)
        try {
            u.send(embed);
        } catch (e) {
            console.log(e);
        }
    })
})

function formatBuyer(buy) {
    if (buy) {
        return "buyer"
    } else {
        return "seller"
    }
}

function formatBuyer2(buy) {
    if (buy) {
        return "want to buy your"
    } else {
        return "want to sell my"
    }
}