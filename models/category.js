var mongoose = require('mongoose');

//Category Schema
var CategorySchema = mongoose.Schema({
    
    title: {
        type: String,
        required: true
    },
    desc: {
        type: String
    },
    slug: {
        type: String
    }
});

var Category = module.exports = mongoose.model('Category',CategorySchema,'kategorije');
