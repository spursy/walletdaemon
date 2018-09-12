var arr = [12,10,1,15,8,7];

//let arr1 = [].concat(arr);
let arr1 = Object.assign(arr);
var result = arr1.sort(function(a, b) {
    return a - b;
});

console.log(JSON.stringify(arr));
console.log('--------------------------------------------------');
console.log(JSON.stringify(result));
