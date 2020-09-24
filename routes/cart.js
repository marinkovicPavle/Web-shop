var express = require('express');
var router = express.Router();

//Get Product model
var Product = require('../models/product');

/*
 * GET add product to cart
 */
router.get('/dodaj-u-korpu/:product', function (req, res) {

    var slug = req.params.product;

    Product.findOne({slug: slug}, function (err, p) {
        if (err)
            console.log(err);

        if (typeof req.session.cart == "undefined") {
            req.session.cart = [];
            req.session.cart.push({
                title: slug,
                qty: 1,
                price: parseFloat(p.price),
                image: '/slike_proizvoda/' + p._id + '/' + p.image
            });
        } else {
            var cart = req.session.cart;
            var newItem = true;

            for (var i = 0; i < cart.length; i++) {
                if (cart[i].title == slug) {
                    cart[i].qty++;
                    newItem = false;
                    break;
                }
            }
            if (newItem) {
                cart.push({
                    title: slug,
                    qty: 1,
                    price: parseFloat(p.price),
                    image: '/slike_proizvoda/' + p._id + '/' + p.image
                });
            }
        }
        //console.log(req.session.cart);
        req.flash('success', 'Proizvod je dodat u korpu!');
        res.redirect('back');
    });
});

/*
 * GET checkout page
 */
router.get('/placanje', function (req, res) {

    if (req.session.cart && req.session.cart.length == 0) {
        delete req.session.cart;
        res.redirect('/korpa/placanje');
    } else {
        res.render('placanje', {
            title: 'Placanje',
            cart: req.session.cart
        });
    }
});

/*
 * GET update product
 */
router.get('/azuriranje/:product', function (req, res) {

    var slug = req.params.product;
    var cart = req.session.cart;
    var action = req.query.action;

    for (var i = 0; i < cart.length; i++) {
        if (cart[i].title == slug) {
            switch (action) {
                case "add":
                    cart[i].qty++;
                    break;
                case "remove":
                    cart[i].qty--;
                    if (cart[i].qty < 1)
                        cart.splice(i, 1);
                    break;
                case "clear":
                    cart.splice(i, 1);
                    if (cart.length == 0)
                        delete req.session.cart;
                    break;
                default:
                    console.log('update problem');
                    break;
            }
            break;
        }
    }
    req.flash('success', 'Korpa je azurirana!');
    res.redirect('/korpa/placanje');

});

/*
 * GET clear cart
 */
router.get('/ocisti-korpu', function (req, res) {
    delete req.session.cart;
    req.flash('success', 'Korpa je ispraznjena!');
    res.redirect('/korpa/placanje');
});

/*
 * GET buy now
 */
router.get('/kupi-odmah', function (req, res) {
    delete req.session.cart;
    
    res.sendStatus(200);
});

//Exports
module.exports = router;
