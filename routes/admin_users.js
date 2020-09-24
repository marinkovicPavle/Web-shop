var express = require('express');
var router = express.Router();
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;
var bcrypt = require('bcryptjs');

//Get page model
var User = require('../models/user');

/*
 * GET pages index
 */

router.get('/', isAdmin, function (req, res) {
    User.find(function (err, korisnici) {
        if (err)
            return console.log(err);
        res.render('admin/korisnici', {
            korisnici: korisnici
        });
    });
});

/*
 * GET add User
 */

router.get('/dodaj-korisnika', isAdmin, function (req, res) {

    var name = "";
    var email = "";
    var username = "";
    var password = "";
    var admin = "";

    res.render('admin/dodaj_korisnika', {
        name: name,
        email: email,
        username: username,
        password: password,
        admin: admin
    });

});

/*
 * POST add User
 */

router.post('/dodaj-korisnika', function (req, res) {

    req.checkBody('name', 'Morate uneti ime i prezime').notEmpty();
    req.checkBody('email', 'Morate uneti vazeci email').isEmail();
    req.checkBody('username', 'Morate uneti korisnicko ime').notEmpty();
    req.checkBody('password', 'Morate uneti sifru').notEmpty();

    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var admin = req.body.admin;

    var errors = req.validationErrors();

    if (errors) {
        console.log('errors');
        res.render('admin/dodaj_korisnika', {
            errors: errors,
            name: name,
            email: email,
            username: username,
            password: password,
            admin: admin
        });
    } else {
        User.findOne({username: username}, function (err, user) {
            if (user) {
                req.flash('danger', 'Uneli ste postojece korisnicko ime, izaberite drugo.');
                res.render('admin/dodaj_korisnika', {
                    errors: errors,
                    name: name,
                    email: email,
                    username: username,
                    password: password,
                    admin: admin
                });
            } else {
                var user = new User({
                    name: name,
                    email: email,
                    username: username,
                    password: password,
                    admin: admin
                });

                bcrypt.genSalt(10, function (err, salt) {
                    bcrypt.hash(user.password, salt, function (err, hash) {
                        if (err)
                            console.log(err);
                        user.password = hash;

                        user.save(function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                req.flash('success', 'Korisnik je dodat!');
                                res.redirect('/admin/korisnici');
                            }
                        });
                    });
                });
            }
        });
    }

});

/*
 * GET set/remove Admin
 */

router.get('/izmeni-korisnika/:id', isAdmin, function (req, res) {

    User.findById(req.params.id, function (err, user) {
        if (err)
            return console.log(err);

        if (user.admin == 1)
            user.admin = 0;
        else
            user.admin = 1;

            user.save(function (err) {
                if (err)
                    return console.log(err);

                User.find(function (err, users) {
                    if (err) {
                        console.log(err);
                    } else {
                        req.app.locals.users = users;
                    }
                });

                req.flash('success', 'Privilegija je izmenjena!');
                res.redirect('/admin/korisnici');
            });    
    });
});

/*
 * GET delete User
 */

router.get('/obrisi-korisnika/:id', isAdmin, function (req, res) {
    User.findByIdAndRemove(req.params.id, function (err) {
        if (err)
            return console.log(err);

            User.find(function (err, users) {
            if (err) {
                console.log(err);
            } else {
                req.app.locals.users = users;
            }
        });

        req.flash('success', 'Korisnik je obrisan!');
        res.redirect('/admin/korisnici/');
    });
});

//Exports
module.exports = router;
