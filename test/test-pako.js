var pako = require('pako');

var test = { my: 'super', puper: [456, 567], awesome: 'pako' };
console.log("obj>>>>" + JSON.stringify(test));

var binaryString = pako.deflate(JSON.stringify(test), { to: 'string' });
console.log("binary string>>>>" + JSON.stringify(binaryString));
//
// Here you can do base64 encode, make xhr requests and so on.
//
console.log("after inflate>>>" + pako.inflate(buffer_data, { to: 'string' }));

var restored = JSON.parse(pako.inflate(binaryString, { to: 'string' }));

console.log("after parse>>>" + JSON.stringify(restored));
