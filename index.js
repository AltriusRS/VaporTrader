const Discord = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const commands = require('./modules/commands');
let config = require('./config.json');
const dbm = (require('./modules/database').new(config));
const client = new Discord.Client({shards: "auto"});
const alertManager = require('./modules/alerts');
let platforms = ["pc", "ps4", "xbox", "switch"];

config.theme = "#c06ed9";
console.log("Configuring...")
setTheme()
console.log("Set Themes...")
setInterval(setTheme, 1000 * 60 * 60 * 24)

function setTheme() {
    let now = new Date();
    let month = now.getMonth();
    if (month === 12) {
        config.theme = "#D8D8D8";
    } else if (month === 9) {
        config.theme = "#ef843d";
    } else if (month === 2) {
        config.theme = "#F573A5";
    } else if (month === 4) {
        config.theme = "#7289DA";
    } else if (month === 5) {
        let k = config;
        let cfgKeys = Object.keys(config);
        config = {
            get theme() {
                let colors = ["#E40303", "#FF8C00", "#FFED00", "#008026", "#004DFF", "#750787"];
                return colors[Math.floor(Math.random() * colors.length)];
            }
        }
        cfgKeys.forEach(key => {
            if (key !== "theme") {
                config[key] = k[key];
            }
        })
    } else if (month === 1) {
        config.theme = "#000000";
    }
}

console.log("Logging in...")
client.login(config.token);

client.on('ready', async () => {
    // updateDB()
    console.log(`Vapor Trader - ${config.version}`)
    if (!config.dev) {
        let v = 0;
        setInterval(async () => {
            let statuses = [`big news! October 31st!`, `with ${await dbm.countItems()} items`, `$help`, `big news! October 31st!`, `with the prices`, `$help`, `big news! October 31st!`, `with my relics`, `with platinum`, `$help`];
            client.user.setActivity(statuses[v]);
            v++
            if (v === statuses.length) v = 0
        }, 60000)
    }
    alertManager.start(platforms, client, dbm);
})

client.on('message', async (message) => {
    if (message.author.bot) {
        if (message.author.username === "GitHub" && message.author.discriminator === '0000') {
            if (message.embeds[0].title.includes(config.patchLocator) && message.embeds[0].description.includes("[PATCH]")) {
                let cnl = await client.channels.fetch('759720616068382730');
                let embed = new Discord.MessageEmbed()
                    .setColor(config.theme)
                    .setTitle("Automated Patch (Source: GitHub)")
                    .setDescription(`Automatically applying patch [${message.embeds[0].description.split('(')[0].split('[`')[1].split('`]')[0]}](${message.embeds[0].url})`)
                    .addField(`Requested By`, "Github")
                    .setTimestamp(Date.now())
                await cnl.send(embed);
                process.exit();
            }
        }
    }
    if (message.guild) {
        dbm.getGuildConfig(message.guild);
    }
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
            .setColor(config.theme)
            .setTitle(pack.alerts.title)
            .setThumbnail(`https://warframe.market/static/assets/${info.order.item.icon}`)
            .setDescription(description)
            .setFooter(pack.alerts.footer)

        if (((alerts.length) - 1) > 0) {
            if (((alerts.length) - 1) > 1) {
                embed.addField(pack.alerts.multiUserAlert.title, pack.alerts.multiUserAlert.plural)
            } else {
                embed.addField(pack.alerts.multiUserAlert.title, pack.alerts.multiUserAlert.singular)
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

client.on("ComparisonOrder", (order) => {

});
if(config.dev){
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

client.on("UserVerified", async (user) => {
    let u = client.users.cache.get(user.id);
    let embed = new Discord.MessageEmbed()
        .setColor(config.theme)
        .setTitle("Verification Success!")
        .setDescription(`Hey there ${u.username}, Your Warframe Market <-> Discord verification has been successful.\nIf you wish to unlink your accounts, you can do so at anytime using \`${config.prefix}unlink\`.`)
        .addField("In-game Name", user.ingame_name, true)

    if (user.avatar !== null) {
        embed.setThumbnail(`https://warframe.market/${user.avatar}`);
    } else {
        embed.setThumbnail(`https://warframe.market/static/assets/user/default-avatar.png`);
    }

    u.send(embed);
})
}

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
