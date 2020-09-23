const request = require('request-promise-native');
const item_url = "https://api.warframe.market/v1/items";
const price_base = "https://api.warframe.market/v1/items/";

let json = {};
let platforms = ["pc", "xbox", "ps4", "switch"]

pull();

async function pull() {
  for (var platform in platforms) {
    
    let options = {
      url: item_url,
      headers: {
        'platform': platforms[platform],
        'language': 'en'
      }
    }
    let body = (JSON.parse(await request.get(options))).payload.items;
    console.log(platforms[platform])
    json[platforms[platform]] = [];
    await sleep(1000);
    for (let i=0; i<body.length;i++){
      let item = body[i];
      options.url = item_url;
      let base = options.url +"/"+ item.url_name;
      options.url = base;
      let item_info = (JSON.parse(await request.get(options))).payload;
      options.url += "/statistics";
      let statistics = (JSON.parse(await request.get(options))).payload;
      options.url = base+"/orders";
      let orders = (JSON.parse(await request.get(options))).payload;
      let custom_item = {
        url_name: item.url_name,
        item_name: item.item_name,
        id: item.id,
        thumbnail: item.thumb,
        orders,
        prices: statistics
      }
      json[platforms[platform]].push(custom_item);
      console.log(`${item.item_name} - (${json[platforms[platform]].length} / ${body.length})`);
      await sleep(1000);
    }
  }
  await fs.writeFileSync('./itemsdb.json', JSON.stringify(json));
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
