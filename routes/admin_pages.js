var express = require('express');
var router = express.Router();
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;

//Get page model
var Page = require('../models/page');

/*
 * GET pages index
 */

router.get('/', isAdmin, function (req, res) {
    Page.find({}).sort({sorting: 1}).exec(function (err, stranice) {
        res.render('admin/stranice', {
            stranice: stranice
        });
    });
});

/*
 * GET add page index
 */

router.get('/dodaj-stranu', isAdmin, function (req, res) {

    var title = "";
    var slug = "";
    var content = "";

    res.render('admin/dodaj_stranu', {
        title: title,
        slug: slug,
        content: content
    });

});

/*
 * POST add page index
 */

router.post('/dodaj-stranu', function (req, res) {

    req.checkBody('title', 'Morate uneti ime naslova').notEmpty();
    req.checkBody('content', 'Morate uneti kontenkt').notEmpty();

    var title = req.body.title;
    var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
    if (slug == "")
        slug = title.replace(/\s+/g, '-').toLowerCase();
    var content = req.body.content;

    var errors = req.validationErrors();

    if (errors) {
        console.log('errors');
        res.render('admin/dodaj_stranu', {
            errors: errors,
            title: title,
            slug: slug,
            content: content
        });
    } else {
        Page.findOne({slug: slug}, function (err, page) {
            if (page) {
                req.flash('danger', 'Uneli ste postojeci slug, izaberite drugi.');
                res.render('admin/dodaj_stranu', {
                    title: title,
                    slug: slug,
                    content: content
                });
            } else {
                var page = new Page({
                    title: title,
                    slug: slug,
                    content: content,
                    sorting: 100
                });

                page.save(function (err) {
                    if (err)
                        return console.log(err);

                    Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
                        if (err) {
                            console.log(err);
                        } else {
                            req.app.locals.pages = pages;
                        }
                    });

                    req.flash('success', 'Stranica je dodata!');
                    res.redirect('/admin/stranice');
                });
            }
        });
    }

});

// Sort pages function
function sortPages(ids, callback) {
    var count = 0;

    for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        count++;

        (function (count) {

            Page.findById(id, function (err, page) {
                page.sorting = count;
                page.save(function (err) {
                    if (err)
                        return console.log(err);
                    ++count;
                    if (count >= ids.length) {
                        callback();
                    }
                });
            });

        })(count);
    }
}

/*
 * POST reorder pages
 */

router.post('/reorder-pages', function (req, res) {
    var ids = req.body['id[]'];

    sortPages(ids, function () {
        Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
            if (err) {
                console.log(err);
            } else {
                req.app.locals.pages = pages;
            }
        });
    });
});

/*
 * GET edit page index
 */

router.get('/izmeni-stranu/:id', isAdmin, function (req, res) {

    Page.findById(req.params.id, function (err, page) {
        if (err)
            return console.log(err);

        res.render('admin/izmeni_stranu', {
            title: page.title,
            slug: page.slug,
            content: page.content,
            id: page._id
        });
    });
});

/*
 * POST izmeni stranu
 */

router.post('/izmeni-stranu/:id', function (req, res) {

    req.checkBody('title', 'Morate uneti ime naslova').notEmpty();
    req.checkBody('content', 'Morate uneti kontenkt').notEmpty();

    var title = req.body.title;
    var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
    if (slug == "")
        slug = title.replace(/\s+/g, '-').toLowerCase();
    var content = req.body.content;
    var id = req.params.id;

    var errors = req.validationErrors();

    if (errors) {
        console.log('errors');
        res.render('admin/izmeni_stranu', {
            errors: errors,
            title: title,
            slug: slug,
            content: content,
            id: id
        });
    } else {
        Page.findOne({slug: slug, _id: {'$ne': id}}, function (err, page) {
            if (page) {
                req.flash('danger', 'Uneli ste postojeci slug, izaberite drugi.');
                res.render('admin/izmeni_stranu', {
                    title: title,
                    slug: slug,
                    content: content,
                    id: id
                });
            } else {

                Page.findById(id, function (err, page) {
                    if (err)
                        return console.log(err);
                    page.title = title;
                    page.slug = slug;
                    page.content = content;

                    page.save(function (err) {
                        if (err)
                            return console.log(err);

                        Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
                            if (err) {
                                console.log(err);
                            } else {
                                req.app.locals.pages = pages;
                            }
                        });

                        req.flash('success', 'Stranica je izmenjena!');
                        res.redirect('/admin/stranice');
                    });
                });
            }
        });
    }

});

/*
 * GET delete page
 */

router.get('/obrisi-stranicu/:id', isAdmin, function (req, res) {
    Page.findByIdAndRemove(req.params.id, function (err) {
        if (err)
            return console.log(err);

        Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
            if (err) {
                console.log(err);
            } else {
                req.app.locals.pages = pages;
            }
        });

        req.flash('success', 'Stranica je obrisana!');
        res.redirect('/admin/stranice/');
    });
});

//Exports
module.exports = router;
