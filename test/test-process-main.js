const { fork } = require('child_process');
const fs = require('fs');

let child1_process, child2_process;

let MainProcess = async function() {
    try {
        let i = 0;
        ManageChildProcess();
        ManageChild2Process();
        setInterval(() => {
            i ++;
            console.log("I am main process !");
            if (i == 10) {
                // throw new Error("Main process is died.");
                console.log(">>>>>>>>>>>>>>>>>> ++++++++++ -------------");
                
                fs.readFileSync("./test.txt");
            }
        }, 1000);
    } catch (error) {
        console.log(`>>>> >>> ${error.message}`);
        MainProcess();
    }
}

let ManageChildProcess = async function() {
    if (child1_process) {
        child1_process.kill();
        child1_process = null;
    }
    child1_process = fork("test-process-child.js");
    child1_process.on('exit', function (code) {
        console.log(`+++ +++ Error code is ${code}`);
        
        if (code == 1) {
            ManageChildProcess();
        }
    });
}

let ManageChild2Process = async function() {
    if (child2_process) {
        child2_process.kill();
        child2_process = null;
    }
    child2_process = fork("test-process-child2.js");
    child2_process.on('exit', function (code) {
        console.log(`+++ +++ Error code is ${code}`);
        
        if (code == 1) {
            ManageChild2Process();
        }
    });
}

process.on('uncaughtException', function (err) {
    console.log('uncaughtException ' + err.stack);
    MainProcess();
});

process.on('unhandledRejection', (err) => {
    console.log('uncaughtException ' + err.stack);
    MainProcess();
})

MainProcess();

