var express = require('express');
var router = express.Router();
var passport = require('passport');
var bcrypt = require('bcryptjs');

//Get page model
var User = require('../models/user');

/*
 * GET register
 */
router.get('/registracija', function (req, res) {
    res.render('registracija', {
        title: 'Registracija'
    });
});

/*
 * POST register
 */
router.post('/registracija', function (req, res) {

    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;

    req.checkBody('name', 'Ime ne sme biti prazno!').notEmpty();
    req.checkBody('email', 'Unesite vazeci email!').isEmail();
    req.checkBody('username', 'Unesite korisnicko ime!').notEmpty();
    req.checkBody('password', 'Unesite sifru!').notEmpty();
    req.checkBody('password2', 'Sifre se ne poklapaju!').equals(password);

    var errors = req.validationErrors();

    if (errors) {
        res.render('registracija', {
            errors: errors,
            user: null,
            title: 'Registracija'
        });
    } else {
        User.findOne({username: username}, function (err, user) {
            if (err)
                console.log(err);

            if (user) {
                req.flash('danger', 'Uneli ste postojece korisnicko ime, izaberite drugo!');
                res.redirect('/korisnici/registracija');
            } else {
                var user = new User({
                    name: name,
                    email: email,
                    username: username,
                    password: password,
                    admin: 0
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
                                req.flash('success', 'Uspesno ste se registrovali!');
                                res.redirect('/korisnici/prijava');
                            }
                        });
                    });
                });
            }
        });
    }
});

/*
 * GET login
 */
router.get('/prijava', function (req, res) {
    
    if(res.locals.user)
        res.redirect('/');
    
    res.render('prijava', {
        title: 'Prijava'
    });
});

/*
 * POST login
 */
router.post('/prijava', function (req, res, next) {
    
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/korisnici/prijava',
        failureFlash: true
    })(req, res, next);
    
});

/*
 * GET logout
 */
router.get('/odjava', function (req, res) {
    
    req.logout();
    
    req.flash('success', 'Uspesno ste se odjavili!');
    res.redirect('/');
});

//Exports
module.exports = router;
