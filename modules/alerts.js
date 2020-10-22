const crypto = require('crypto');
const config = require('../config.json');
const axios = require('axios')
const ws = require('ws');
const Discord = require('discord.js');

const pendingChats = {}

module.exports.start = (platforms, client, dbm) => {
    platforms.forEach(platform => {
            let socket;
            if (platform === "pc") {
                console.log(config)
                socket = new ws("wss://warframe.market/socket?platform=" + platform, [], {
                    headers: {
                        'Cookie': 'JWT=' + config.JWT
                    }
                })
            } else {
                socket = new ws("wss://warframe.market/socket?platform=" + platform)

            }
        setTimeout(socket.close, 1000 * 60 * 15)
            socket.on("close", (code) => {
                socket = handleClose(code, platform, client, dbm);
            })
            socket.on('open', () => {
                open(socket, platform);
            })
            socket.on('message', async (data) => {
                handleMessage(data, platform, client, dbm, socket)
            })
        }
    )
}

async function handleClose(code, platform, client, dbm) {
    let socket;
    console.log(code)
    let embed = new Discord.MessageEmbed()
        .setTitle(`Socket disconnect (${platform})`)
        .setColor('#aa0000')
        .setDescription("Reconnecting...")
        .setTimestamp(Date.now())
    client.channels.get("759720616068382730").send(embed);

    if (platform === "pc") {
        socket = new ws("wss://warframe.market/socket?platform=" + platform, [], {
            headers: {
                'Cookie': 'JWT=' + config.JWT
            }
        })
    } else {
        socket = new ws("wss://warframe.market/socket?platform=" + platform)
    }
    socket.on("close", (code) => {
        socket = handleClose(code, platform, client, dbm);
    })
    socket.on('open', () => {
        open(socket, platform);
    })
    socket.on('message', async (data) => {
        handleMessage(data, platform, client, dbm, socket)
    })
    return socket;
}

async function open(socket, platform) {
    console.log(platform)
    if (platform === "pc") {
        socket.send(JSON.stringify({"type": "@WS/USER/SET_STATUS", "payload": "online"}))
    }
    console.log(`${platform.toUpperCase()} feed is open`)
    socket.send(JSON.stringify({type: "@WS/SUBSCRIBE/MOST_RECENT"}));
}

async function handleMessage(data, platform, client, dbm, socket) {
    data = JSON.parse(data);
    if (data.type === "@WS/SUBSCRIPTIONS/MOST_RECENT/NEW_ORDER") {
        let info = data.payload;
        if (!config.dev) {
            let buy = true;
            if (info.order.user.status === "ingame" && info.order.visible) {
                if (info.order.order_type === "sell") {
                    buy = false;
                }
                let alerts = await dbm.getPriceAlerts(info.order.item.id, info.order.platinum, buy, platform);
                if (alerts.length > 0) {
                    client.emit('priceAlert', alerts, info, buy)
                }
            }
        } else {
            let {order} = info;
            let u = await dbm.getUserConfigFromWFMid(order.user.id);
            // if (u !== undefined) {
            //     if (u.watching) {
            handleOrderCheck(order, client, platform, u)
            //     }
            // }
        }
    } else if (data.type === "@WS/chats/NEW_MESSAGE") {
        if (!config.dev) {
            let md5sum = crypto.createHash('md5');
            md5sum.update(`${data.payload.chat_id}${data.payload.message_from}*${data.payload.send_date}`);
            let digest = md5sum.digest('hex');
            //console.log(data)
            if (pendingChats[data.payload.chat_id]) {
                let response;
                try {
                    response = await axios.get("https://api.warframe.market/v1/profile/" + data.payload.raw_message);
                } catch (e) {

                }
                if (response !== undefined) {
                    response = response.data;
                    if (response.payload.profile.id !== data.payload.message_from) {
                        socket.send(JSON.stringify({
                            "type": "@WS/chats/SEND_MESSAGE",
                            "payload": {
                                "chat_id": data.payload.chat_id,
                                "message": "Sorry, that username doesnt seem to match our records, is it spelled correctly?\nNote: this is case sensitive.\nBeep Boop. i am a bot.",
                                "temp_id": digest,
                            }
                        }));
                    } else {
                        dbm.pool.query(`UPDATE general.user_config SET ingame_name = '${data.payload.raw_message}', code = NULL WHERE user_config.wfm_id = '${response.payload.profile.id}'`, (err, _) => {
                            if (err) {
                                console.log(err)
                                socket.send(JSON.stringify({
                                    "type": "@WS/chats/SEND_MESSAGE",
                                    "payload": {
                                        "chat_id": data.payload.chat_id,
                                        "message": "Sorry, verification is currently unavailable.\nThe bot is experiencing some problems\nBeep Boop. i am a bot.",
                                        "temp_id": digest,
                                    }
                                }));
                            } else {
                                delete pendingChats[data.payload.chat_id];
                                socket.send(JSON.stringify({
                                    "type": "@WS/chats/SEND_MESSAGE",
                                    "payload": {
                                        "chat_id": data.payload.chat_id,
                                        "message": "Congratulations, you have been Verified\nBeep Boop. i am a bot.",
                                        "temp_id": digest,
                                    }
                                }));
                                dbm.pool.query(`SELECT * from general.user_config WHERE wfm_id = '${data.payload.message_from}'`, (err, {rows}) => {
                                    rows[0].avatar = response.payload.profile.avatar;
                                    client.emit("UserVerified", rows[0]);
                                })
                            }
                        });
                    }
                } else {
                    socket.send(JSON.stringify({
                        "type": "@WS/chats/SEND_MESSAGE",
                        "payload": {
                            "chat_id": data.payload.chat_id,
                            "message": "Whoops, it appears that this profile does not exist.\nBeep Boop. i am a bot.",
                            "temp_id": digest,
                        }
                    }));
                }
            } else {
                dbm.pool.query(`SELECT code FROM general.user_config WHERE code = '${data.payload.raw_message}'`, (err, result) => {
                    if (err) {
                        console.log(err)
                        socket.send(JSON.stringify({
                            "type": "@WS/chats/SEND_MESSAGE",
                            "payload": {
                                "chat_id": data.payload.chat_id,
                                "message": "Sorry, verification is currently unavailable.\nThe bot is experiencing some problems\nBeep Boop. i am a bot.",
                                "temp_id": digest,
                            }
                        }));
                    } else if (result.rows.length > 0) {
                        dbm.pool.query(`UPDATE general.user_config SET wfm_id = '${data.payload.message_from}' WHERE user_config.code = '${result.rows[0].code}'`, (err, response) => {
                            if (err) {
                                console.log(err)
                                socket.send(JSON.stringify({
                                    "type": "@WS/chats/SEND_MESSAGE",
                                    "payload": {
                                        "chat_id": data.payload.chat_id,
                                        "message": "Sorry, verification is currently unavailable.\nThe bot is experiencing some problems\nBeep Boop. i am a bot.",
                                        "temp_id": digest,
                                    }
                                }));
                            } else {
                                pendingChats[data.payload.chat_id] = digest;
                                socket.send(JSON.stringify({
                                    "type": "@WS/chats/SEND_MESSAGE",
                                    "payload": {
                                        "chat_id": data.payload.chat_id,
                                        "message": "Hey there, thanks for verifying.\nJust 1 more thing before you go, please could you send your in-game name (this should match your username on warframe.market.\nBeep Boop. i am a bot.",
                                        "temp_id": digest,
                                    }
                                }));
                            }
                        });
                    } else {
                        socket.send(JSON.stringify({
                            "type": "@WS/chats/SEND_MESSAGE",
                            "payload": {
                                "chat_id": data.payload.chat_id,
                                "message": "This verification code is not registered to any users.\nPlease make sure you entered it correctly and try again.\nBeep Boop. i am a bot.",
                                "temp_id": digest,
                            }
                        }));
                    }
                });
            }
        }
    }
}

async function handleOrderCheck(order, client, platform, user) {
    let orders = (await axios.get(`https://api.warframe.market/v1/items/${order.item.url_name}/orders`, {headers: {"platform":platform}})).data.payload.orders;
    orders = orders.filter(od => od.order_type !== order.order_type);
    if (order.item.tags.includes("mod")) {
        orders = orders.filter(od => od.mod_rank === order.mod_rank)
    }

    let best = undefined;
    let highestscore = 0;
    let leaderboard = [];

    for (let i = 0; i < orders.length; i++) {
        let siteOrder = orders[i];
        let score = scoreUser(siteOrder, order);
        if (score > highestscore) {
            leaderboard.unshift({score: highestscore, order: best});
            best = siteOrder;
            highestscore = score;
        }
    }
    if (order.order_type === "sell") order.order_type = "buyer"
    if (order.order_type === "buy") order.order_type = "seller"
    if (best !== undefined) {
        client.emit("UserOrderFeedback", user)
    }
}

function scoreUser(site, order) {
    let repMultiplier = 1.3;
    let priceMultiplier = 0.5;
    if (order.order_type !== "sell") priceMultiplier += 1;
    let priceDiff = order.platinum - site.platinum;
    let user = site.user;
    let repScore = user.reputation * repMultiplier;
    let priceScore = priceDiff * priceMultiplier;
    let score = repScore + priceScore;
    if (user.status !== "ingame") score = 0;
    if (!site.visible) score = 0;
    return Math.round(score);
}
