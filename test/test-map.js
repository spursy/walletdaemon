let arr = [{coinsymbol: "ethusdt", coinid: 1}, {coinsymbol: "btcusdt", coinid: 2}];

let result = arr.map(function(item) {
    return item.coinsymbol
})

console.log(JSON.stringify(result));
