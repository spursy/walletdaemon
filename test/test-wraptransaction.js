const wraptransaction = require('../common/mysql/wraptransaction');



let DoTest = async function( sql_scripts) {
    try {
        let result = await wraptransaction.QueryDBPromise(sql_scripts);
        console.log("result >>>>>>>><<<<<<" + JSON.stringify(result));        
    } catch (error) {
        console.log("error >>>>>>>>><<<<<<" + error.stack);
    }
}

let interval = 0;

try {
    setInterval(function() {

        interval = interval + 3;
        let sql_script1 = `update withdraws set amount = ${interval + 1} where id = 1`;
        let sql_script2 = `update withdraws set amount = ${interval} where id = 1`;
        //console.log(sql_script2);
        
    
        let sql_scripts = [];
        sql_scripts.push(sql_script1);
        sql_scripts.push(sql_script2);
        DoTest(sql_scripts);
    }, 2000)
} catch (error) {
    console.log(error.stack);
    
}

