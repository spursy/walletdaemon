const Binance = require('node-binance-api');
const config = require('./config');
const logger = require('../common/logger/logger');

var OrderBook = {};
exports.OrderBook = OrderBook;
function Init() {
    let TAG = logger.Tag("Bi An Init");
    try {
        const binance = new Binance().options({
            APIKEY: 'pCBdtlqD0cir2z5zxbrw0NqFJxlKrP4LrR1HtldD3pDEsLF5sciEPsQlxpoY7uiJ',
            APISECRET: 'ZDs0lya8GpI8cfLvOZFLfFZ4XO7Q7iQlsOA1W4fnnpRhfH98RkQcbngaYcnDSgjb',
            useServerTime: true, // If you get timestamp errors, synchronize to server time at startup
            test: true // If you want to use sandbox mode where orders are simulated
        });
        
        let symbols = config.CoinsSymbols.map(function(item) {
            return item.coinsymbol
        });
        // Periods: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
        binance.websockets.candlesticks(symbols, "1m", (candlesticks) => {
            let { e:eventType, E:eventTime, s:symbol, k:ticks } = candlesticks;
            let { o:open, h:high, l:low, c:close, v:volume, n:trades, i:interval, x:isFinal, q:quoteVolume, V:buyVolume, Q:quoteBuyVolume } = ticks;
            // console.log(symbol+" "+interval+" candlestick update");
            // console.log("open: "+open);
            // console.log("high: "+high);
            // console.log("low: "+low);
            // console.log("close: "+close);
            // console.log("volume: "+volume);
            // console.log("isFinal: "+isFinal);
            OrderBook[symbol] = {symbol: symbol, low: low, high: high, open:open, close: close};
        });
    } catch (error) {
        logger.error_exchange(TAG, `${error.stack}`);
    }
}

Init();