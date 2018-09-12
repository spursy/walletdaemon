const amqp = require('amqplib');
const path = require('path');
const config = require('../config/config');
const logger = require(path.join(__dirname,'../logger/logger.js'));
let amqp_config = path.join(__dirname, '../config/amqp.yml');
const readYaml = require('read-yaml');

let environment = 'development'  

if(process.argv.length > 2){
	environment = process.argv[2]
}  

let GetAMQPOptions = function() {
    let amqp_options = readYaml.sync(amqp_config);
    return amqp_options[environment];
}

var SendAMQPQueue = function(temp_trans, q) {     
    let DebugTag = logger.DebugTag("SendAMQPQueue");
    
    return new Promise (async function(resolve, reject) {
        let conn, channel;
        let q = config.Amqp_Deposit_Channel;
        try {
            let amqp_options = GetAMQPOptions();
            conn = await amqp.connect(amqp_options);
            let channel = await conn.createChannel();
    
            channel.assertQueue(q,{durable: true}).then(function(_qok){
                for (let i=0; i<temp_trans.length; i++) {
                    let msg = JSON.stringify(temp_trans[i]);
                    channel.sendToQueue(q, Buffer.from(msg));
                    console.log(DebugTag, `Send ${msg} to amqp.`);
                    logger.info(DebugTag, `Send ${msg} to amqp.`);
                }
                
                resolve({status: 1});
            });
        } catch (error) {
            console.log(DebugTag, error.stack);
            logger.info(DebugTag, error.stack);
            resolve({status: 0});
        } finally {
            if (conn && channel) {
                channel.close();
                conn.close();
            }
        } 
    });
}

exports.SendAMQPQueue = SendAMQPQueue;