const config = require('./config.json');
const Discord = require('discord.js');
const commands = require('./modules/commands');
const dbm = (require('./modules/database').new(config));
const client = new Discord.Client({shards: "auto"});
const alertManager = require('./modules/alerts');
let platforms = ["pc", "ps4", "xbox", "switch"];
// const relicDrops = require('./relics.json')
//
// for(let i=0;i<Object.keys[relicDrops].length;i++){
//
// }
//

client.login(config.token);
client.on('ready', async () => {
    console.log(`Vapor Trader - ${config.version}\nConnecting to feeds`)
    await client.user.setActivity(`with ${await dbm.countItems()} items`)
    alertManager.start(platforms, client, dbm);
})

client.on('message', async (message) => {
    if (message.author.bot) {
        if (message.author.username === "GitHub" && message.author.discriminator === '0000') {
            if (message.embeds[0].title.includes(config.patchLocator) && message.embeds[0].description.includes("[PATCH]")) {
                let cnl = await client.channels.fetch('759720616068382730');
                let embed = new Discord.MessageEmbed()
                    .setColor("#C06ED9")
                    .setTitle("Automated Patch (Source: GitHub)")
                    .setDescription(`Automatically applying patch [${message.embeds[0].description.split('(')[0].split('[`')[1].split('`]')[0]}](${message.embeds[0].url})`)
                    .addField(`Requested By`, "Github")
                    .setTimestamp(Date.now())
                await cnl.send(embed);
                process.exit();
            }
        }
    };
    let guildconfig = await dbm.getGuildConfig(message.guild);
    commands.handle(message, client, dbm);
})

client.on('priceAlert', async (alerts, info, buy) => {
    for (var i = 0; i < alerts.length; i++) {
        let alert = alerts[i];
        let u = client.users.cache.get(alert.user)
        let pack = await commands.choosePack(dbm, alert.user);
        let description = pack.alerts.description;
        description = description.split("$ITEM_NAME").join(info.order.item[pack.apiName].item_name);
        description = description.replace("$BUYER_FORMATTED", formatBuyer(buy));
        description = description.replace("$WTS-B", formatBuyer2(buy));
        description = description.replace("$INGAME_NAME", info.order.user.ingame_name);
        description = description.replace("$PRICE", info.order.platinum);
        let embed = new Discord.MessageEmbed()
            .setColor("#C06ED9")
            .setTitle(pack.alerts.title)
            .setThumbnail(`https://warframe.market/static/assets/${info.order.item.icon}`)
            .setDescription(description)
            .setFooter(pack.alerts.footer)

        if (((alerts.length) - 1) > 0) {
            if (((alerts.length) - 1) > 1) {
                embed.addField(pack.alerts.multUserAlert.title, pack.alerts.multUserAlert.plural)
            } else {
                embed.addField(pack.alerts.multUserAlert.title, pack.alerts.multUserAlert.singular)
            }
        }

        if (info.order.user.avatar) {
            embed.setAuthor(info.order.user.ingame_name, `https://warframe.market/static/assets/${info.order.user.avatar}`);
        } else {
            embed.setAuthor(info.order.user.ingame_name, "https://warframe.market/static/assets/user/default-avatar.png");
        }
        try {
            await u.send(embed);
        } catch (e) {
            console.log(e);
        }
    }
})

client.on("guildCreate", async (guild) => {
    await dbm.getGuildConfig(guild)
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
        return "want to sell my"
    } else {
        return "want to buy your"
    }
}