const mongoose = require('mongoose');
const stockTransactionSchema = new mongoose.Schema({
    transactionId: Number,
    accountId: String,
    symbol: String,
    transactionType: String,
    amount: Number,
    price: Number,
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('stockTransaction', stockTransactionSchema);