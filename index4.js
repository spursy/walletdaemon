const logger = require('./common/logger/logger');

setInterval(function() {
    // let environment = 'development'
    // if(process.argv.length > 2){
	//     environment = process.argv[2]
    // }
    // logger.info(`>>>>>>>> ${environment}`)
    let environment = process.env.NODE_ENV;
    logger.info(`>>>>>>>> ${environment}`)
    logger.info("Come in index4.")
}, 3000)