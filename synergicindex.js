// 运行方式 node index development  /  node index production
const rp = require('request-promise');
//const redis = require("redis");
const baseConvert = require('baseconvert');
const fs = require('fs');
const logger = require('./common/logger/logger.js');
const readYaml = require('read-yaml');
const path = require('path');
const amqp = require('./common/amqp'); 
const dateformat = require('dateformat');
const util = require('./common/util');
const { fork } = require('child_process');

let parity_path = path.join(__dirname, './common/config/parity.yml');
let backup_path = path.join(__dirname, "./backup_block_number.txt");
let currency_config = path.join(__dirname, './common/config/currencies.yml');
let mySql = require(path.join(__dirname, './common/mysql'));
let mySqlPromise = require(path.join(__dirname, './common/mysql/wraptransaction'));
let config = require(path.join(__dirname, './common/config/config'));

let recent_queue_length = 6000;
let recent_queue_array = [];
let target_Trans_Count = 0;
let isSync = false;
let environment = 'development';
let isExistedMedianColumn = false;

let SyncParityDaemon = async function() {
    let DebugTag = logger.DebugTag("SyncParityDaemon");
    let ErrorTag = logger.ErrorTag("SyncParityDaemon");
    
    try {
        if(process.argv.length > 2){
            environment = process.argv[2]
        }
    
        logger.synergic_info(DebugTag, "Sync parity node starting");
        console.log(DebugTag, "Sync parity node starting");
        // get parity url
        let parity_url = GetParityUrl();
        if (!parity_url) {
            console.log("No valid parity url");
            logger.synergic_info(ErrorTag, "No valid parity url");        
            return;
        }
      
        await SyncParityNodes(parity_url);
        setInterval(async function() {
            if (!isSync) {
                await SyncParityNodes(parity_url);
            }
        }, 12000);
    } catch (error) {
        console.log(ErrorTag, error.stack);
        logger.synergic_info(ErrorTag, error.stack);
        setTimeout(() => {
            SyncParityDaemon();
        }, 12000);
    }
}


let GetParityUrl =  function() {
    let DebugTag = logger.DebugTag("GetParityUrl");
    let ErrorTag = logger.ErrorTag("GetParityUrl");

    let parity_config = readYaml.sync(parity_path);
    if (parity_config[environment] && parity_config[environment].parity_url) { 
        return parity_config[environment].parity_url;
    }  else {
        logger.synergic_info(ErrorTag, "No valid parity url");
        return;
    }
}

let SyncParityNodes = async function(parity_url) {
    let DebugTag = logger.DebugTag("SyncParityNodes");
    let ErrorTag = logger.ErrorTag("SyncParityNodes");

    try {
        isSync = true;
        // get backup block number
        let backup_block_number = parseFloat(ReadBlockNumber(backup_path)) + 5;
        let last_block_number = await GetEthBlockNumber(parity_url);
        //last_block_number = 3251458;
		console.log(`Backup block number is ${backup_block_number}.`);
        console.log(`The last block number is ${last_block_number}.`);  

        logger.synergic_info(DebugTag, `Backup block number is ${backup_block_number}.`);
        logger.synergic_info(DebugTag, `The last block number is ${last_block_number}.`);
        if (backup_block_number && !isNaN(Number(backup_block_number))) {
            let backup_number = parseInt(backup_block_number);
            if (backup_number < last_block_number) {
                for (let index = backup_number+1; index <= last_block_number; index++) {
                     // query all valid eth accounts
                    let eth_accounts = await GetEthAccounts();
                    console.log(DebugTag, `The length of eth accounts form db is ${eth_accounts.length}.`);
                    let erc20_accounts = await GetERC20Counts();
                    console.log(DebugTag, `The length of erc20 account form db is ${erc20_accounts.length}.`);
                    let withdraw_items = await GetWithdrawItems();
                    console.log(DebugTag, `The length of monitor txids form db is ${withdraw_items.length}.`);

                    await SyncBlock(parity_url, index, eth_accounts, erc20_accounts, withdraw_items);         
                    console.log(DebugTag, `Scan blcok number ${index} successfully.`);
                    logger.synergic_info(DebugTag, `Scan blcok number ${index} successfully.`);
                }
            } else { // backup_block_number is larger than last block number
                console.log("Noted: backup block number is not less than the last block number.");
                logger.synergic_info(DebugTag, `Backup block number is not less than the last block number.`);
            }        
        } else {
            logger.synergic_info(ErrorTag, `Backup file not contain backup block number.`);
        }
        isSync = false;
    } catch (error) {
        throw error;
    }
    
}

let SyncBlock = async function(parity_url, eth_block_number, eth_accounts, erc20_accounts, withdraw_items) {
    let DebugTag = logger.DebugTag("SyncBlock");

    try {
        let eth_block_number_base16 = baseConvert.converter(eth_block_number).fromBase(10).toBase(16);
        let block_hash = await GetEthBlockByNumber(parity_url, eth_block_number_base16);
        logger.synergic_info(DebugTag, `${eth_block_number}'s block hash is ${block_hash}.`);
        let block_transaction_count = await GetBlockTransCountByHash(parity_url, block_hash);
        var total_count =  baseConvert.converter(block_transaction_count).fromBase(16).toBase(10);
        //logger.synergic_info(DebugTag, `${block_hash}'s  transaction count is ${total_count}.`);
        
        let temp_trans = [];
        let transactions_array = []; // all transaction in the same block
        for (let index = 0; index < total_count; index++) {
            let transaction_index = baseConvert.converter(index).fromBase(10).toBase(16);
            let transaction = await GetTransByBlockHashAndIndex(parity_url, block_hash, `0x${transaction_index}`);
            transactions_array.push(transaction.hash);

            let targetTran = await GetTargetTran(parity_url, eth_block_number_base16, eth_accounts, erc20_accounts, transaction);
            
            if (targetTran && targetTran.data) {
                target_Trans_Count ++;
                temp_trans.push(targetTran);
                console.log(DebugTag, `target transaction count is ${target_Trans_Count}.`);
                logger.synergic_info(DebugTag, `target transaction count is ${target_Trans_Count}.`);
            };
        }
        await MonitorTransaction(withdraw_items, transactions_array);

        if (temp_trans.length > 0) {
            let result = await amqp.SendAMQPQueue(temp_trans);
            while (!result.status) { // If amqp server is block, wait 10 seconds and send amqp again.              
                await TimeOut(10000);
                result = await amqp.SendAMQPQueue(temp_trans);
            }
        }
        
    } catch (error) {
        throw error;
    }
}

let MonitorTransaction = async function(withdraw_items, transactions_array) {
    let DebugTag = logger.DebugTag("MonitorTransaction");
    let ErrorTag = logger.ErrorTag("MonitorTransaction");
    try {
        // 
        let monitor_transactions = [];
        for (let i = 0; i < withdraw_items.length; i ++) {
            for(let j = 0; j < transactions_array.length; j++) {
                if (withdraw_items[i].txId === transactions_array[j]) {
                    let amqp_obj = {"commandId":300201,"data":{}};
                    amqp_obj.data.txId = transactions_array[j]
                    monitor_transactions.push(amqp_obj);
                }
            }
        }
        if (monitor_transactions.length > 0) {
            let result = await amqp.SendAMQPQueue(monitor_transactions);
            while (!result.status) { // If amqp server is block, wait 10 seconds and send amqp again.              
                await TimeOut(10000);
                result = await amqp.SendAMQPQueue(monitor_transactions);
            }
        }
    } catch (error) {
        throw(error);
    }
}

let TimeOut = async function(ms) {
    await new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}

let ReadBlockNumber = function(backup_path) {
    return fs.readFileSync(backup_path, 'utf8');
}

let GetEthBlockNumber = async function(parity_url) {
    var options = {
        uri: parity_url,
        body: {
            "method":"eth_blockNumber",
            "params":[],
            "id":1,
            "jsonrpc":"2.0"
        },
        headers: {
            'Content-Type': 'application/json',
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    try {
        var eth_block = await rp.post(options);
        return baseConvert.converter(eth_block.result).fromBase(16).toBase(10);
    } catch (error) {
        throw error;
    }
}

let GetEthBlockByNumber = async function(parity_url, eth_block_number) {   
    var options = {
        uri: parity_url,
        body: {
            "method":"eth_getBlockByNumber",
            "params":[`0x${eth_block_number}`,true],
            "id":1,
            "jsonrpc":"2.0"
        },
        headers: {
            'Content-Type': 'application/json',
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    try {
        var eth_block = await rp.post(options);
        if (eth_block&& eth_block.result && eth_block.result.hash) {
            return eth_block.result.hash;
        } else {
             throw new Error(`Block number ${eth_block_number} does not exist block hash.`);
        }
    } catch (error) {
        throw error;
    }
}

let GetBlockTransCountByHash = async function(parity_url, block_hash) {
    var options = {
        uri: parity_url,
        body: {
            "method":"eth_getBlockTransactionCountByHash",
            "params":[`${block_hash}`],
            "id":1,
            "jsonrpc":"2.0"
        },
        headers: {
            'Content-Type': 'application/json',
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    try {
        var block_trans_Count = await rp.post(options);
        if (block_trans_Count.result || block_trans_Count.result===0) {
            return block_trans_Count.result;
        } else {
            throw new Error(`Block hash ${block_hash} does not exist transctions.`);
        }
    } catch (error) {
        throw error;
    }
}

let GetTransByBlockHashAndIndex = async function(parity_url, block_hash, index) {
    var options = {
        uri: parity_url,
        body: {
            "method":"eth_getTransactionByBlockHashAndIndex",
            "params":[`${block_hash}`, `${index}`],
            "id":1,
            "jsonrpc":"2.0"
        },
        headers: {
            'Content-Type': 'application/json',
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    try {
        let transaction = await rp.post(options);
        if (transaction && transaction.result) {
            return transaction.result;
        } else {
            throw new Error(`Current transaction is not existed.`);
        }
    } catch (error) {
        throw error;
    }
}

let GetEthAccounts = async function() {
    try {
        let sql_scripts = "SELECT * FROM `account_address` order by id desc";
        return await mySql.QueryDB(sql_scripts);
    } catch (error) {
        throw error;
    }
}

let GetERC20Counts = async function () {
    try {
        let script = "SELECT * FROM currencies where contractAddress is not NULL;";
        return await mySql.QueryDB(script);
    } catch (error) {
        throw error;
    }
}

let GetWithdrawItems = async function() {
    try {
        let script = `SELECT * FROM withdraws where status = ${config.Withdraw_Status};`
        return await mySql.QueryDB(script);
    } catch (error) {
        throw error;
    }
}

let GetTargetTran = async function(parity_url, eth_block_number_base16, eth_accounts, erc20_accounts, transaction) {
    try {
        let erc20_array = erc20_accounts.filter(function(account) {
            if (account.contractAddress && transaction.to && transaction.input) {
                let fun_tag = transaction.input.slice(0, 10);
                return account.contractAddress.toLowerCase()===transaction.to.toLowerCase() && fun_tag==="0xa9059cbb";
            }
        })
        if (erc20_array && erc20_array.length>0 ) {
            let to_address = '0x' + transaction.input.slice(34, 74);
            let sql_scripts = "SELECT * FROM `account_address` Where address = '" +to_address+"'  order by id desc";
            let erc20_from_db = await mySql.QueryDB(sql_scripts);
            if (erc20_from_db && erc20_from_db.length>0) {
                let result = await DoubleCheckTransacton(parity_url, eth_block_number_base16, erc20_array[0], transaction.hash); 
                if (result) {
                    return GetERC20Tran(transaction, erc20_array[0].decimals);
                } else {
                    console.log("Filter invalid transaction >>>> >>> >>>>> >>>> " + transaction.hash);
                    logger.synergic_info("Filter invalid transaction >>>> >>> >>>>> >>>> " + transaction.hash);
                }
            }
        }
    
        let eth_array = eth_accounts.filter(function(account) {
            return transaction.to && account.address && account.address.toLowerCase() === transaction.to.toLowerCase();
        })
        if (eth_array && eth_array.length>0 ) {
            logger.synergic_info(">>>>>>>>" + JSON.stringify(transaction));
            return GetEthTran(transaction);
        } 
    } catch (error) {
        throw error;
    }
}


let DoubleCheckTransacton = async function(parity_url, block_number, erc20_item, trans_hash) {
    try {
        let list = await FilterTransByTopic(parity_url, block_number, erc20_item);
        let result = list.filter((item) => {
            return item.transactionHash == trans_hash;
        }); 
        if (!result || result.length === 0) return false;

        let receipt = await GetTransactionReceipt(parity_url, trans_hash);
        if (receipt && receipt.status == 0x1) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        throw error;
    }
}

let FilterTransByTopic = async function(parity_url, block_number, erc20_item) {    
    var options = {
        uri: parity_url,
        body: {
            "method":"eth_getLogs",
            "params":[{"fromBlock": `0x${block_number}`, "toBlock": `0x${block_number}`,"address": erc20_item.contractAddress}],
            "id":1,
            "jsonrpc":"2.0"
        },
        headers: {
            'Content-Type': 'application/json',
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    try {
        let transaction_list = await rp.post(options);
        return transaction_list.result;
    } catch (error) {
        throw error;
    }
}

let GetTransactionReceipt = async function(parity_url, trans_hash) {
    let options = {
        uri: parity_url,
        body: {
            "method":"eth_getTransactionReceipt",
            "params":[trans_hash],
            "id":1,
            "jsonrpc":"2.0"
        },
        headers: {
            'Content-Type': 'application/json',
        },
        json: true // Automatically stringifies the body to JSON
    }
    try {
        let receipt = await rp.post(options);       
        if (receipt && receipt.result) {
            return receipt.result;
        } else {
            return undefined;
        }
    } catch (error) {
        throw error;
    }
}

let GetERC20Tran = function(transaction, decimal) {
    try {
        let erc20_transaction = Object.create(null);
        erc20_transaction.commandId = 100000;

        let address_base64 = transaction.input.slice(34, 74);
        let to_Address = '0x' + address_base64;
        let value_base64 = transaction.input.slice(74, 138)
        let value = baseConvert.converter(value_base64).fromBase(16).toBase(10)/(Math.pow(10, decimal));
        let data = {
            txId: transaction.hash,
            fromAddress: transaction.from,
            toAddress: to_Address,
            contractAddress: transaction.to,
            value: value,
            type: "ERC20",
        };
        erc20_transaction.data = data;

        return erc20_transaction;
    } catch (error) {
        throw error;
    }
}

let GetEthTran = function(transaction) {
    try {
        let eth_transaction = Object.create(null);
        eth_transaction.commandId = 100000;
        let data = {
            fromAddress: transaction.from,
            toAddress: transaction.to,
            value: baseConvert.converter(transaction.value).fromBase(16).toBase(10)/(Math.pow(10, 18)),
            txId: transaction.hash,
            type: "ETH",
        }
        eth_transaction.data = data;

        return eth_transaction;
    } catch (error) {
        throw error;
    }
}

process.on('uncaughtException', function (err) {
    logger.synergic_info("Uncaught Exception >> > ", err.stack);
    console.log('uncaughtException ' + err.stack);
    SyncParityDaemon();
});

SyncParityDaemon();