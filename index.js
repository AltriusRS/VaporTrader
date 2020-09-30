const config = require('./config.json');
const Discord = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const commands = require('./modules/commands');
const dbm = (require('./modules/database').new(config));
const client = new Discord.Client({shards: "auto"});
const alertManager = require('./modules/alerts');
let platforms = ["pc", "ps4", "xbox", "switch"];


client.login(config.token);

client.on('ready', async () => {
    //updateDB()
    console.log(`Vapor Trader - ${config.version}`)
    //await client.user.setActivity(`with ${await dbm.countItems()} items`)
    //alertManager.start(platforms, client, dbm);
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
    }
    // if (message.guild) {
    //     dbm.getGuildConfig(message.guild);
    // }
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
    let embed = new Discord.MessageEmbed()
        .setColor("#00b500")
        .setTitle("Joined Guild")
        .setDescription(`Total Guilds: ${formatNo(client.guilds.cache.size)}`)
        .addField("Name", guild.name, true)
        .addField("ID", guild.id, true)
        .addField("Owner", `${guild.owner.user.username}#${guild.owner.user.discriminator}`, true)
        .setTimestamp(Date.now());
    embed.setImage(guild.bannerURL());
    if (embed.image.url === null) embed.setImage(guild.splashURL());
    embed.setThumbnail(guild.iconURL())

    await client.channels.cache.get("760621133535248396").send(embed)
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

function formatNo(x) {
    let parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(",");
}

async function updateDB() {
    let {data} = await axios.get("https://docs.google.com/uc?id=1w_cSmhsULIoSt4tyNgnh7xY2N98Mfpbf&export=download");
    let relics = data.relics;
    let vaultInfo = data.eqmt;
    let keys = Object.keys(vaultInfo);
    for (let i = 0; i < keys.length; i++) {
        console.log(`${i + 1}/${keys.length}`)
        let item = vaultInfo[keys[i]];
        console.log(item)
        let subKeys = Object.keys(item.parts);
        for (let a = 0; a < subKeys.length; a++) {
            console.log(`\t${a + 1}/${subKeys.length}`)
            let subItem = item.parts[subKeys[a]];
            subItem.name = subKeys[a];
            console.log(subItem)
            let b = await findItemByName(subItem.name);
            console.log(b);
            process.exit()
        }
    }
    // console.log(data)
}

async function findItemByName(name) {
    return new Promise((resolve, reject) => {
        dbm.pool.query(`SELECT * FROM general.items WHERE item.name_en ILIKE '${name}'`)
    })
}