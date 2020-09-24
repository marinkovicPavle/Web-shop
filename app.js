var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var config = require('./config/database');
var bodyParser = require('body-parser');
var session = require('express-session');
var expressValidator = require('express-validator');
var fileUpload = require('express-fileupload');
var passport = require('passport');

var socket = require('socket.io');


// Connect to db
mongoose.connect(config.database, {useNewUrlParser: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('Connected to mongoDB')
});


// Init app
var app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Set public foler
app.use(express.static(path.join(__dirname, 'public')));

// Set global errors variable
app.locals.errors = null;

// Get Page Model
var Page = require('./models/page');

// Get all pages to pass to header.ejs
Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
    if (err) {
        console.log(err);
    } else {
        app.locals.pages = pages;
    }
});

// Get Category Model
var Category = require('./models/category');

// Get all Categories to pass to header.ejs
Category.find(function (err, categories) {
    if (err) {
        console.log(err);
    } else {
        app.locals.categories = categories;
    }
});

// Express fileUpload middlware
app.use(fileUpload());

// Body Parser middleware
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));
// parse application/json
app.use(bodyParser.json());

// Express Validator middleware
app.use(expressValidator({
    errorFormater: function (param, msg, value) {
        var namespace = param.split('.')
                , root = namespace.shift()
                , formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return{
            param: formParam,
            msg: msg,
            value: value
        };
    },
    customValidators: {
        isImage: function (value, filename) {
            var extension = (path.extname(filename)).toLowerCase();
            switch (extension) {
                case '.jpg':
                    return '.jpg';
                case '.jpeg':
                    return '.jpeg';
                case '.png':
                    return '.png';
                case '':
                    return '.jpg';
                default:
                    return false;
            }
        }
    }
}));

// Express Session middleware
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    //cookie: { secure: true }
}));

// Express Messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});

// Passport Config
require('./config/passport')(passport);

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', function (req, res, next) {
   res.locals.cart = req.session.cart;
   res.locals.user = req.user || null;
   next();
});

// Set routs
var pages = require('./routes/pages.js');
var products = require('./routes/products.js');
var cart = require('./routes/cart.js');
var users = require('./routes/users.js');
var adminPages = require('./routes/admin_pages.js');
var adminCategories = require('./routes/admin_categories.js');
var adminProducts = require('./routes/admin_products.js');
var adminUsers = require('./routes/admin_users.js');

app.use('/admin/stranice', adminPages);
app.use('/admin/kategorije', adminCategories);
app.use('/admin/proizvodi', adminProducts);
app.use('/admin/korisnici', adminUsers);
app.use('/proizvodi', products);
app.use('/korpa', cart);
app.use('/korisnici', users);
app.use('/', pages);


var Comments = require('./models/comments');
// Start the server
var port = 3000;
var server = app.listen(port, function () {
    console.log('Server started on port ' + port);
});

// Socket setup & pass server
var io = socket(server);
io.on('connection', (socket) => {

    console.log('made socket connection', socket.id);

    // Handle chat event
    socket.on('chat', function(data){
        var handle = data.handle;
        var message = data.message;
        // console.log(data);
        var comments = new Comments({
            handle: handle,
            message: message
        });

        comments.save(function (err) {
            if (err)
                return console.log(err);
        });

        io.emit('chat', data);
    });

    // Handle typing event
    socket.on('typing', function(data){
        socket.broadcast.emit('typing', data);
    });
    
    socket.on('styping', function(data){
        socket.broadcast.emit('styping', data);
    });

     // Handle clear chat
     socket.on('clear', function(data){
        // Remove all chats from collection
        Comments.remove({}, function(){
            // Emit cleared
            socket.emit('cleared');
        });
    });
});