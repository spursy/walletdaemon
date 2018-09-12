const huobi = require('./exchange/huobi');
const logger = require('./common/logger/logger');
const exchange_config = require('./exchange/config');
const mysql = require('./common/mysql/index');
const rp = require('request-promise');
const schedule = require('node-schedule');
let exchange_rate;

let Init = async function() {
    let TAG = logger.Tag("Monitor other exchange price >>> >");
    // get exchange rate and store as exchange_rate
    await GetExchangeRate();
    try {
        console.log("Come in monitor price process ::: ");
        let coins_symbols = exchange_config.CoinsSymbols;
        setInterval(async function() {
            let order_book = huobi.OrderBook;

            for (let index = 0; index < coins_symbols.length; index ++) {
                let coin = coins_symbols[index];
                if (order_book[coin.coinsymbol] && typeof order_book[coin.coinsymbol] === 'object') {
                    let get_decimal_script = `SELECT decimals FROM currencies where cid = ${ coin.coinid}`;
                    let list = await mysql.QueryDB(get_decimal_script);
                    let decimals = (list[0] && list[0].decimals) ? list[0].decimals : 14;
                    
                    let value = (order_book[coin.coinsymbol].open + order_book[coin.coinsymbol].close)/2 * Math.pow(10, decimals) * exchange_rate;

                    await mysql.QueryDB(`update currencies set marketPrice = ${value} where cid = '${coin.coinid}'`);
                }
            }
        }, 60000);
    } catch (error) {
        console.log(TAG, `Error message is ${error.stack}`);
        logger.error_exchange(TAG, error.stack)
        // Init();
    }
}

let GetExchangeRate = async function() {
    try {
        if (!exchange_rate) {
            exchange_rate = await RequestExchangeRate();
            // get a exchange rate interval 1 hour
            schedule.scheduleJob('59 59 * * * *', async function(){
                exchange_rate = await RequestExchangeRate();
            });  
        }
    } catch (error) {
        throw error;
    }
}

let RequestExchangeRate = async function() {
    try {
        let url = "http://op.juhe.cn/onebox/exchange/currency?from=USD&to=CNY&key=0cc3e5d57876703f71c67f5fc92a09eb"
        let options = {
            uri: url,
            json: true // Automatically parses the JSON string in the response
        };

        let ret = await rp.get(options);
        
        if (ret.error_code == 0 && ret.result.length>0 && ret.result[0].exchange) {
            logger.info_exchange(`Exchange rate from api is >>> ${ret.result[0].exchange}`);
            return ret.result[0].exchange
        } else {
            logger.info_exchange(`Exchange rate not from api is >>> 6.5`);
            return 6.5;
        }
    } catch (error) {
        throw error;
    }
}

Init();