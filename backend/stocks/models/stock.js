const mongoose = require('mongoose');
const stockSchema = new mongoose.Schema({
    symbol: String,
    name: String,
    price: Number,
});
module.exports = mongoose.model('stock', stockSchema);