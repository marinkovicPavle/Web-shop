var mongoose = require('mongoose');

//Comments Schema
var CommentsShema = mongoose.Schema({
    
    handle: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    }
});

var Comments = module.exports = mongoose.model('Comments',CommentsShema,'komentari');


