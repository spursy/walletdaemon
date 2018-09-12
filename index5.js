const huobi = require('./exchange/bian');
const logger = require('./common/logger/logger');


setInterval(function() {
    let ADAETH = huobi.OrderBook.ADAETH;

    logger.info_exchange(`BI AN result is >>> > ${JSON.stringify(ADAETH)}`);

    let ADXETH = huobi.OrderBook.ADXETH;
}, 3000)