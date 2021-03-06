let error = true;

let res = [
    db.createCollection('users'),

    db.users.createIndex({ accountId: 1 }, { unique: true }),


    db.users.insert({
        "accountId" : "47808892",
        "name" : "Sorin Boiangiu",
        "email" : "sorin@nginx.com",
        "cash" : 5902.248,
        "password" : "nginx",
        "stocks" : {
            "btc" : 3.1,
            "eth" : 3.5,
            "ltc" : 40.1
        },
        "picture" : "default"
    }),
    db.users.insert({
        "accountId" : "85408892",
        "name" : "Satoshi Nakamoto",
        "email" : "satoshi@bitcoin.com",
        "cash" : 5902.248,
        "password" : "bitcoin",
        "stocks" : {
            "btc" : 3.1,
            "eth" : 3.5,
            "ltc" : 40.1
        },
        "picture" : "default"
    }),
    db.users.insert({
        "accountId" : "2658892",
        "name" : "Big Trader",
        "email" : "trader@gmail.com",
        "cash" : 5902.248,
        "password" : "123456",
        "stocks" : {
            "btc" : 3.1,
            "eth" : 3.5,
            "ltc" : 40.1
        },
        "picture" : "default"
    }),
];

printjson(res);