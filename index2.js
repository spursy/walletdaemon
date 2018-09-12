const BASE_URL = "https://api.huobi.pro";
const rp = require('request-promise');
const logger = require('./common/logger/logger');

let Start = async function() {
    let TAG = logger.Tag("Start");
    try {
        let item = 'eth-usdt';
        let coin = item.split('-')[0];
        let currency = item.split('-')[1];
        await GetDepth(coin, currency);
    } catch (error) {
        logger.error(TAG, error.stack);
    }
}

let GetDepth = async function(coin, currency) {
     try {
        let url = `${BASE_URL}/market/depth?symbol=${coin}${currency}&type=step0`;
        var opts = {
            method: 'GET',
            uri: url,
            json: true
        }
        let result = await rp(opts);
        logger.info(JSON.stringify(result));
     } catch (error) {
         throw error;
     }
}

Start();