const { fork } = require('child_process');

const forked = fork('test-son.js');

// forked.on('message', (msg) => {
//   console.log('Message from child', msg);
// });

// forked.send({ hello: 'world' });

console.log("father in >>> ");

setInterval(function() {
    console.log("father in >>> ");
}, 1000);
