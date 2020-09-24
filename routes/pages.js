var express = require('express');
var router = express.Router();

//Get page model
var Page = require('../models/page');
var Comment = require('../models/comments');
/*
 * GET /
 */
router.get('/', function (req, res) {
    Page.findOne({slug: 'pocetna'}, function(err, page) {
        if(err)
            console.log(err);
        
        res.render('index', {
            title: page.title,
            content: page.content,
            page: req.url,
        });
    });
});
/*
 * GET a page
 */
router.get('/:slug', function(req, res) {

    var slug = req.params.slug;
    Page.findOne({slug: slug}, function(err, page) {
        Comment.find({}, function (err, comments) {
        if(err)
            console.log(err);
        
        if (!page) {
            res.redirect('/');
        } else {
            res.render('index', {
                title: page.title,
                content: page.content,
                page: req.url,
                comments: comments,
            });
        }
    });
});
});
//Exports
module.exports = router;
