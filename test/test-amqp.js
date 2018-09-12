const amqp = require('../common/amqp/index');

let init = async function() {
    console.log('Start Start');
    let temp = {"commandId":100000,"data":{"fromAddress":"124","toAddress":"0x1213","contractAddress":"0x33333","value":"0.2323", "txId":"23423423l4j2l34l23j","type":"ERC20"}};
    let arr = [temp]
    amqp.SendAMQPQueue(arr).then(function(data) {
        console.log(`After sending amqp ${JSON.stringify(data)}`);
    })
    
    console.log('End End');
}

process.on('uncaughtException', function (err) {
    console.log('uncaughtException ' + err.stack);
});
init();