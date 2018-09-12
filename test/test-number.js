Math.formatFloat = function (f, digit) {
    var m = Math.pow(10, digit);
    return parseInt(f * m, 10) / m;
}

console.log(Math.formatFloat(6.8-0.9,14));
let result = 6.8 - 0.9;
console.log(6.8 - 0.9);
console.log(result + 0.000000000000001);

// console.log((6.8 - 0.9).toFixed(14));
// console.log((6.8 - 0.9).toFixed(20));

// console.log((42.6833909200000000 - 0.1).toFixed(16));
// var result = (14.4112000088899934 * 1000 - 0.1 * 1000)/10000;
// console.log((14.4112000088899934).toFixed(18));

// var result2 = ((14.4112000088899934).toFixed(19) * 1000 - (0.1).toFixed(19) * 1000)
// console.log("result <<< " +result);
// console.log(">>>>>>>");
// console.log("result2 <<< " +result2);
// console.log("result2 >>>><<< " +result2.toFixed(16));
// let result3 = result2/1000;
// console.log(">>>>>>>");
// console.log("result <<< " +result3.toFixed(16));

// var a = 1232.0007661313123123;
// var b = Math.trunc(a * Math.pow(10, 16));
// console.log(b / Math.pow(10, 16))
