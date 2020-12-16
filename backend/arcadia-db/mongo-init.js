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
    })

];

printjson(res);