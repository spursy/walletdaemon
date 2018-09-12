const huobi = require('./exchange/huobi');
const logger = require('./common/logger/logger');


setInterval(function() {
    let result = huobi.OrderBook;
    console.log(">>>>" + JSON.stringify(result));
}, 3000)