const ws = require('ws');
module.exports.start = (platforms, client, dbm) => {
    platforms.forEach(platform => {
        let socket = new ws("wss://warframe.market/socket?platform=" + platform)
        socket.on('open', () => {
            console.log(`${platform.toUpperCase()} feed is open`)
            socket.send(JSON.stringify({type: "@WS/SUBSCRIBE/MOST_RECENT"}));
        })
        socket.on('message', async (data) => {
            data = JSON.parse(data);
            if (data.type === "@WS/SUBSCRIPTIONS/MOST_RECENT/NEW_ORDER") {
                let info = data.payload;
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
            }
        })
    })
}