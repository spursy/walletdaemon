const log4js = require('log4js');
const path = require('path');
log4js.configure(path.join(__dirname, "./log4js-config.json"));
const logInfo = log4js.getLogger("logger");
const synergicInfo = log4js.getLogger("synergiclogger");
let logError = log4js.getLogger("error");
let log_exchange = log4js.getLogger("info_exchange");
let error_exchange = log4js.getLogger("error_exchange");
log4js.info = logInfo.info.bind(logInfo);
log4js.synergic_info = logInfo.info.bind(synergicInfo);
log4js.error = logError.error.bind(logError);
log4js.info_exchange = logError.info.bind(log_exchange);
log4js.error_exchange = logError.info.bind(error_exchange);
/**
  * logger tag
  * @param {Object} method
  */
log4js.Tag = function(method){
    "use strict";
    var timestamp=new Date().getTime();
    if(method){
        return method+`[${timestamp}]>>> `
    }else{
        return `[${timestamp}]>>> `
    }

}
log4js.DebugTag = function(method){
    "use strict";
    if(method){
        return `${method}>>> `
    }else{
        return `>>> `
    }
}
log4js.ErrorTag = function(method){
    "use strict";
    var timestamp=new Date().getTime();
    if(method){
        return method+`>>> ERROR >>>[${timestamp}]>>> `
    }else{
        return `>>> ERROR >>>[${timestamp}]>>> `
    }
}
module.exports = log4js;