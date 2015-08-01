//Routes

var logic = require('./logic');
var User  = require('../models/user');

module.exports = function(app, passport) {

	app.get('/', function(req, res) {
		res.render('index.ejs', { message: req.flash('validationMessage') });
	});


	// =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/acessar', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') }); 
    });

    // process the login form
	app.post('/acessar', passport.authenticate('local-login', {
		successRedirect : '/mapa',
		failureRedirect : '/acessar',
		failureFlash    : true }
	));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/registro', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

	app.post('/registro', passport.authenticate('local-signup', {
		successRedirect : '/', // redirect to the secure profile section
		failureRedirect : '/registro', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
    }));

	app.get('/confirma/:token', function(req, res) {
		User.findOne({ resetToken: req.params.token }, function(err, user) {
			if (!user) {
				req.flash('validationMessage', 'Token de validação inválido');
				return res.redirect('/');
			}
			user.resetToken = undefined;
			user.resetValid = undefined;
			user.validated  = true;
			user.save(function(err) {
				if (err) {
					req.flash('validationMessage', 'Erro ao validar token');
					return res.redirect('/');
				}
				req.flash('validationMessage', 'Token validado com sucesso. Prossiga com o seu Login');
				return res.redirect('/');
			});
		});
	});
		
	
	app.get('/mapa', isLoggedIn, function(req, res) {
		var data = req.user.dNasc.getUTCDate() + "/" + (req.user.dNasc.getUTCMonth()  + 1)+ "/" + req.user.dNasc.getUTCFullYear();
		res.render('ciclo.ejs', { message: req.flash('validationMessage'), data: logic.calcula(data, req.user.nome), user: req.user });
	});

	app.post('/mapa', isSuperAdmin, function(req, res) {
		res.render('ciclo.ejs', { message: req.flash('validationMessage'), data: logic.calcula(req.body.data, req.body.nome), user: req.user });
	});

	
    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/sair', function(req, res) {
        req.logout();
        res.redirect('/');
    });

	
	app.get('*', function(req, res) {
		res.redirect('/');
	});

}

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on 
	if (!req.isAuthenticated())
	// if they aren't redirect them to the home page
		res.redirect('/');
	if (req.user.validated)
		return next();
	req.flash('validationMessage', 'Usuário não validado!');
	res.redirect('/');
}

// route middleware to make sure a user is logged in
function isSuperAdmin(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (!req.isAuthenticated()) {
		res.redirect('/');
	} else {
		if (req.user.superUser)
			return next();
		res.redirect('/mapa');
	}
}
