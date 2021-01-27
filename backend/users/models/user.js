const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    accountId: String,
    name: String,
    email: String,
    picture: String,
    cash: Number,
    stocks: Object,
    password: String,
    deviceId: String
});
module.exports = mongoose.model('user', userSchema);