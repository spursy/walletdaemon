const moment = require('moment');
const WebSocket = require('ws');
const pako = require('pako');
const config = require('./config');
const logger = require('../common/logger/logger');

// const WS_URL = 'wss://api.huobi.pro/ws';
// // 此地址用于国内不翻墙调试
// // const WS_URL = 'wss://api.huobi.br.com/ws';

var OrderBook = {};

exports.OrderBook = OrderBook;

function handle(data) {
    //console.log('received', data.ch, 'data.ts', data.ts, 'crawler.ts', moment().format('x'));
    //console.log("Handle Data >>>> " + JSON.stringify(data));
    let sub = data.ch;
    let sub_array = sub.split('.');
    let sub_name = sub_array[1];
    OrderBook[sub_name] = data.tick;
}

function subscribe(ws) {
    let symbols = config.CoinsSymbols.map(function(item) {
        return item.coinsymbol
    });
    for (let symbol of symbols) {
        console.log(symbol);
        
        ws.send(
            JSON.stringify({
                "sub": `market.${symbol}.kline.15min`,
                "id": `${symbol}`
            })
        );
    }
}

function init() {
    let TAG = logger.Tag("Huo Bi Init");
    let ws_url = config.HuoBiWSUrl;
    var ws = new WebSocket(ws_url);
    ws.on('open', () => {
        subscribe(ws);
    });
    ws.on('message', (data) => {
        let text = pako.inflate(data, {
            to: 'string'
        });
        let msg = JSON.parse(text);
        if (msg.ping) {
            ws.send(JSON.stringify({
                pong: msg.ping
            }));
        } else if (msg.tick) {
            handle(msg);
        } else if (msg.status === "error") {
            console.log(TAG, `The error message is ${JSON.stringify(msg)}.`);
            logger.info_exchange(TAG, `The error message is ${JSON.stringify(msg)}.`);
        } else {
            console.log(TAG, `${msg.id} exchange WS is open.`);
            logger.info_exchange(TAG, `${msg.id} exchange WS is open.`);
        }
    });
    ws.on('close', () => {
        console.log(TAG, "Huo bi exchange WS is closed.");
        logger.info_exchange(TAG, "Huo bi exchange WS is closed.");
        init();
    });
    ws.on('error', err => {
        console.log(TAG, `error stack is >>> ${err.stack}.`);
        logger.info_exchange(TAG, `error stack is >>> ${err.stack}.`);
        init();
    });
}

init();