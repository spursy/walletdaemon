let ChildProcess2 = async function() {
    try {
        let i = 0;
        setInterval(() => {
            i ++;
            if (i == 5) {
                throw new Error("child process 2 is died.");
            }
            console.log("I am child process 2 2 2 2!");
        }, 1000);
    } catch (error) {
        // process.send({Status: 0});
        console.log("+++ ++++ +++ " + error.message);
    }
}

ChildProcess2();