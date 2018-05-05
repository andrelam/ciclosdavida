//Routes

var logic  = require('./logic');
var User   = require('../models/user');
var crypto = require('crypto');
//var async  = require('async');

module.exports = function(app, passport) {

	app.get('/', function(req, res) {
		if (req.isAuthenticated()) {
		// if they aren't redirect them to the home page
			res.redirect('/mapa');
		} else {
			res.render('index.ejs', { message: req.flash('validationMessage'), user: req.user });
		}
	});


	// =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/acessar', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage'), user: req.user }); 
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
		failureRedirect : '/', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
    }));

	app.get('/contato', function(req, res) {
		if (!req.isAuthenticated()) {
			res.redirect('/');
		} else {
			if (req.user.validated) {
				res.render('contact.ejs', { message: req.flash('contactMessage'), user: req.user });
			} else {
				req.flash('validationMessage', 'Você precisa logar para utilizar esta funcionalidade!');
				res.redirect('/');
			}
		}
	});

	app.post('/contato', function(req, res, next) {
		var data = req.user.dNasc.getUTCDate() + "/" + (req.user.dNasc.getUTCMonth()  + 1)+ "/" + req.user.dNasc.getUTCFullYear();
		logic.sendMessage(req.user.nome, req.user.email, data, req.body.message);
		req.flash('contactMessage', 'Mensagem enviada');
		res.redirect('/mapa');
    });

	app.get('/esqueci', function(req, res) {
		res.render('forgot.ejs', { message: req.flash('forgotMessage') });
	});

	app.post('/esqueci', function(req, res, next) {
		User.findOne({ email: req.body.email }, function(err, user) {
			if (!user) {
				req.flash('forgotMessage', 'Email não cadastrado');
				return res.redirect('/esqueci');
			}
			user.resetToken = randomValueBase64(32);
			user.resetValid = Date.now() + 3600000;
			user.save(function(err) {
				if (err)
					throw err;
				user.sendMail(true);
				req.flash('forgotMessage', 'Um email de confirmação foi enviado para ' + user.email);
				return res.redirect('/esqueci');
			});
		});
    });
	
	app.get('/confirma/:token', function(req, res) {
		User.findOne({ resetToken: req.params.token }, function(err, user) {
			if (!user) {
				req.flash('validationMessage', 'Token de validação inválido');
				return res.redirect('/');
			}
			if (user.validated) { // user was already validated. Password reset requested
				if (user.resetValid < Date.now()) {
					req.flash('validationMessage', 'Token para reset da senha expirado');
					return res.redirect('/');
				}
				res.render('reset.ejs', { message: req.flash('validationMessage'), user: req.user, token: user.resetToken });
			} else { // New user
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
			}
		});
	});

	app.post('/redefinir/:token', function(req, res) {
		User.findOne({ resetToken: req.params.token, resetValid: { $gt: Date.now() } }, function(err, user) {
			if (err) {
				req.flash('validationMessage', 'Token de redefinição de senha inválido ou expirado');
				return res.redirect('/');
			}
			if (!user) {
				req.flash('validationMessage', 'Token de redefinição de senha inválido ou expirado');
				return res.redirect('/');
			}
			if (!user.validated) { // user was already validated. Password reset requested
				req.flash('validationMessage', 'Reset da senha para novo usuário não permitido');
				return res.redirect('/');
			}
            user.password = user.generateHash(req.body.password);
			user.resetToken = undefined;
			user.resetValid = undefined;
			user.validated  = false;
			user.save(function(err) {
				if (err) {
					req.flash('validationMessage', 'Erro ao validar token');
					return res.redirect('/');
				}
				user.sendMail(false);
				req.flash('validationMessage', 'Senha resetada. Um email de confirmação foi enviado.');
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
		if (req.isAuthenticated()) {
			res.redirect('/mapa');
		} else {
			res.redirect('/');
		}
	});

}

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on 
	if (!req.isAuthenticated()) {
	// if they aren't redirect them to the home page
		res.redirect('/');
	} else {
		if (req.user.validated) {
			return next();
		} else {
			req.flash('validationMessage', 'Usuário não validado!');
			res.redirect('/');
		}
	}
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


function randomValueBase64 (len) {
	return crypto.randomBytes(Math.ceil(len * 3 / 4))
		.toString('base64')   // convert to base64 format
		.slice(0, len)        // return required number of characters
		.replace(/\+/g, '0')  // replace '+' with '0'
		.replace(/\//g, '0'); // replace '/' with '0'
}
