 const BigNumber = require('bignumber.js');

/**
* (new BigNumber()).toFixed(param1, param2)
* param1 保留的小数的位数
* param2 保留小数时的方式： 1 -> 最后保留的小数位不进行四舍五入  
*/
let a = 0.555598908887898976689009955;
console.log(a);
let b = (new BigNumber(a)).toFixed(14, 1) - 0.1;
console.log(b);

let big_number = 888877776666.555333322221111;
console.log(big_number);
let big_number2 = (new BigNumber(big_number)).toFixed(14, 1);
console.log(big_number2);

