const mongoose = require('mongoose');
const cashTransactionSchema = new mongoose.Schema({
    transactionId: Number,
    fromAccountId: String,
    toAccountId: String,
    amount: Number,
    date: Date

});

module.exports = mongoose.model('cashTransaction', cashTransactionSchema);