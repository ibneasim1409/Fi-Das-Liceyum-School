const mongoose = require('mongoose');

const customListSchema = new mongoose.Schema({
    listId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true
    },
    items: [{
        type: String,
        trim: true
    }]
}, { timestamps: true });

const CustomList = mongoose.model('CustomList', customListSchema);
module.exports = CustomList;
