var express = require('express');
var router = express.Router();
var mkdirp = require('mkdirp');
var fs = require('fs-extra');
var fileUpload = require('express-fileupload');
var resizeImg = require('resize-img');
var multer = require('multer');

var auth = require('../config/auth');
var isAdmin = auth.isAdmin;

var storage = multer.diskStorage({
    destination: function (request, file, callback) {
        callback(null, '.public/slike_proizvoda');
    },
    filename: function (request, file, callback) {
        console.log(file);
        callback(null, file.originalname)
    }
});
var upload = multer({storage: storage});

//Get product model
var Product = require('../models/product');

//Get Category model
var Category = require('../models/category');

/*
 * GET products index
 */

router.get('/', isAdmin, function (req, res) {
    var count;

    Product.count(function (err, c) {
        count = c;
    });

    Product.find(function (err, products) {
        res.render('admin/proizvodi', {
            products: products,
            count: count
        });
    });
});

/*
 * GET add products
 */

router.get('/dodaj-proizvod', isAdmin, function (req, res) {

    var title = "";
    var desc = "";
    var price = "";

    Category.find(function (err, categories) {
        res.render('admin/dodaj_proizvod', {
            title: title,
            desc: desc,
            categories: categories,
            price: price
        });
    });
});

/*
 * POST add products index
 */

router.post('/dodaj-proizvod', function (req, res) {

    var imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";

    req.checkBody('title', 'Morate uneti naziv proizvoda.').notEmpty();
    req.checkBody('desc', 'Morate uneti opis proizvoda.').notEmpty();
    req.checkBody('price', 'Morate uneti cenu proizvoda.').isDecimal();
    req.checkBody('image', 'Morate uploadovati sliku proizvoda').isImage(imageFile);

    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var desc = req.body.desc;
    var price = req.body.price;
    var category = req.body.category;

    var errors = req.validationErrors();

    if (errors) {
        Category.find(function (err, categories) {
            res.render('admin/dodaj_proizvod', {
                errors: errors,
                title: title,
                desc: desc,
                categories: categories,
                price: price
            });
        });
    } else {
        Product.findOne({slug: slug}, function (err, product) {
            if (product) {
                req.flash('danger', 'Uneli ste naslov proizvoda koji vec postoji, izaberite drugi.');
                Category.find(function (err, categories) {
                    res.render('admin/dodaj_proizvod', {
                        title: title,
                        desc: desc,
                        categories: categories,
                        price: price
                    });
                });
            } else {
                var price2 = parseFloat(price);
                var product = new Product({
                    title: title,
                    slug: slug,
                    desc: desc,
                    price: price2,
                    category: category,
                    image: imageFile
                });

                product.save(function (err) {
                    if (err)
                        return console.log(err);

                    mkdirp('public/slike_proizvoda/' + product._id, function (err) {
                        return console.log(err);
                    });

                    mkdirp('public/slike_proizvoda/' + product._id + '/galerija', function (err) {
                        return console.log(err);
                    });

                    mkdirp('public/slike_proizvoda/' + product._id + '/galerija/ikonice', function (err) {
                        return console.log(err);
                    });

                    if (imageFile != "") {
                        var productImage = req.files.image;
                        var path = 'public/slike_proizvoda/' + product._id + '/' + imageFile;

                        productImage.mv(path, function (err) {
                            return console.log(err);
                        });
                    }

                    req.flash('success', 'Proizvod je dodat!');
                    res.redirect('/admin/proizvodi');
                });
            }
        });
    }

});

/*
 * GET edit product index
 */

router.get('/izmeni-proizvod/:id', isAdmin, function (req, res) {

    var errors;

    if (req.session.errors)
        errors = req.session.errors;
    req.session.errors = null;

    Category.find(function (err, categories) {

        Product.findById(req.params.id, function (err, p) {
            if (err) {
                console.log(err);
                res.redirect('/admin/proizvodi');
            } else {
                var galleryDir = 'public/slike_proizvoda/' + p._id + '/galerija';
                var galleryImages = null;

                fs.readdir(galleryDir, function (err, files) {
                    if (err) {
                        console.log(err);
                    } else {
                        galleryImages = files;

                        res.render('admin/izmeni_proizvod', {
                            title: p.title,
                            errors: errors,
                            desc: p.desc,
                            categories: categories,
                            category: p.category.replace(/\s+/g, '-').toLowerCase(),
                            price: parseFloat(p.price),
                            image: p.image,
                            galleryImages: galleryImages,
                            id: p._id
                        });
                    }
                });
            }
        });
    });

});

/*
 * POST izmeni proizvod
 */

router.post('/izmeni-proizvod/:id', function (req, res) {

    var imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";

    req.checkBody('title', 'Morate uneti naziv proizvoda.').notEmpty();
    req.checkBody('desc', 'Morate uneti opis proizvoda.').notEmpty();
    req.checkBody('price', 'Morate uneti cenu proizvoda.').isDecimal();
    req.checkBody('image', 'Morate uploadovati sliku proizvoda').isImage(imageFile);

    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var desc = req.body.desc;
    var price = req.body.price;
    var category = req.body.category;
    var pimage = req.body.pimage;
    var id = req.params.id;

    var errors = req.validationErrors();

    if (errors) {
        req.session.errors = errors;
        res.redirect('/admin/proizvodi/izmeni-proizvod/' + id);
    } else {
        Product.findOne({slug: slug, _id: {'$ne': id}}, function (err, p) {
            if (err)
                console.log(err);

            if (p) {
                req.flash('danger', 'Uneli ste postojece ime proizvoda, izaberite drugo.');
                res.redirect('/admin/proizvodi/izmeni-proizvod/' + id);
            } else {
                Product.findById(id, function (err, p) {
                    if (err)
                        console.log(err);

                    p.title = title;
                    p.slug = slug;
                    p.desc = desc;
                    p.price = parseFloat(price);
                    p.category = category;
                    if (imageFile != "") {
                        p.image = imageFile;
                    }

                    p.save(function (err) {
                        if (err)
                            console.log(err);

                        if (imageFile != "") {
                            if (pimage != "") {
                                fs.remove('public/slike_proizvoda/' + id + '/' + pimage, function (err) {
                                    if (err)
                                        console.log(err);
                                });
                            }

                            var productImage = req.files.image;
                            var path = 'public/slike_proizvoda/' + id + '/' + imageFile;

                            productImage.mv(path, function (err) {
                                return console.log(err);
                            });
                        }
                        req.flash('success', 'Proizvod je usepsno izmenjen!');
                        res.redirect('/admin/proizvodi');
                    });
                });
            }
        });
    }

});

/*
 * POST product gallery
 */

router.post('/galerija-proizvoda/:id', function (req, res) {

    var productImage = req.files.file;
    var id = req.params.id;
    var path = 'public/slike_proizvoda/' + id + '/galerija/' + req.files.file.name;
    var thumbsPath = 'public/slike_proizvoda/' + id + '/galerija/ikonice/' + req.files.file.name;

    productImage.mv(path, function (err) {
        if (err)
            console.log(err);

        resizeImg(fs.readFileSync(path), {width: 100, height: 100}).then(function (buf) {
            fs.writeFileSync(thumbsPath, buf);
        });
    });

    res.sendStatus(200);
});

/*
 * GET delete image
 */

router.get('/obrisi-sliku/:image', isAdmin, function (req, res) {

    var originalImage = 'public/slike_proizvoda/' + req.query.id + '/galerija/' + req.params.image;
    var thumbImage = 'public/slike_proizvoda/' + req.query.id + '/galerija/ikonice/' + req.params.image;

    fs.remove(originalImage, function (err) {
        if (err) {
            console.log(err);
        } else {
            fs.remove(thumbImage, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    req.flash('success', 'Slika je obrisana!');
                    res.redirect('/admin/proizvodi/izmeni-proizvod/' + req.query.id);
                }
            });
        }
    });
});

/*
 * GET delete product
 */

router.get('/obrisi-proizvod/:id', isAdmin, function (req, res) {
    
    var id = req.params.id;
    var path = 'public/slike_proizvoda/' + id;
    
    fs.remove(path, function (err) {
        if (err) {
            console.log(err);
        } else {
            Product.findByIdAndRemove(id, function (err) {
                if (err)
                    console.log(err);
            });
            
            req.flash('success', 'Proizvod je obrisan!');
            res.redirect('/admin/proizvodi');
        }
    });
});

//Exports
module.exports = router;
