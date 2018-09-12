let ChildProcess = async function() {
    try {
        let i = 0;
        setInterval(() => {
            i ++;
            if (i == 5) {
                throw new Error("child process is died.");
            }
            console.log("I am child process 1 1 1 !");
        }, 1000);
    } catch (error) {
        // process.send({Status: 0});
        console.log("+++ ++++ +++ " + error.message);
    }
}

ChildProcess();
