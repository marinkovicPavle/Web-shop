exports.isUser = function (req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        req.flash('danger', 'Molimo vas ulogujte se.');
        res.redirect('/korisnici/prijava');
    }
}

exports.isAdmin = function (req, res, next) {
    if (req.isAuthenticated() && res.locals.user.admin == 1) {
        next();
    } else {
        req.flash('danger', 'Samo za administratore sajta!');
        res.redirect('/korisnici/prijava');
    }
}