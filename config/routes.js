//Routes

var logic        = require('./logic');
var User         = require('../models/user');
var Notification = require('../models/notification');
var crypto       = require('crypto');
var logger       = require('./logger');
const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');

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
        res.render('login.ejs', { message: req.flash('loginMessage'), user: req.user, _csrf: req.csrfToken() }); 
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
		var dados = { nome: '',
					  email: '',
					  data: '' };
        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage'), _csrf: req.csrfToken(), dados: dados, errors: [] });
    });

	app.post('/registro', [
		check('nome').isLength({ min: 1 }).withMessage('Favor informar o seu nome').trim(),
		check('email').isEmail().withMessage('Favor informar um endereço de email válido').trim(),
		check('password').isLength({ min: 8 }).withMessage('A senha deve possuir pelo menos 8 caracteres'),
		check('cfm_pwd', 'A senha de confirmação deve ser igual à senha informada').exists().custom((value, { req }) => value === req.body.password),
		check('data', 'A data de nascimento deve ser uma data válida').custom((value) => logic.validateDate(value))
	], (req, res, next) => {

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			var dados = { nome: req.body.nome,
			              email: req.body.email,
						  data: req.body.data };
			res.render('signup.ejs', { message: req.flash('signupMessage'), _csrf: req.csrfToken(), dados: dados, errors: errors.array() });
			return;
		} else {
			check('email').normalizeEmail();
		}
	
	}, passport.authenticate('local-signup', {
			successRedirect : '/', // redirect to the secure profile section
			failureRedirect : '/registro', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
    }));

	app.get('/contato', function(req, res) {
		if (!req.isAuthenticated()) {
			res.redirect('/');
		} else {
			if (req.user.validated) {
				res.render('contact.ejs', { message: req.flash('contactMessage'), user: req.user, _csrf: req.csrfToken() });
			} else {
				logger.info('RGC-User ' + req.user.email + ' is not validated. Redirecting to /.');
				req.flash('validationMessage', 'Você precisa logar para utilizar esta funcionalidade!');
				res.redirect('/');
			}
		}
	});

	app.post('/contato', function(req, res, next) {
		logger.info('RPC-Message sent from ' + req.user.email);
		logger.verbose('RPC-Message content: ' + req.body.message);
		var notification = new Notification();
		notification.newNotification(req.user, req.body.message);
		req.flash('contactMessage', 'Mensagem enviada. Clique em voltar para retornar ao mapa.');
		return res.redirect('/contato');
    });

	app.get('/esqueci', function(req, res) {
		res.render('forgot.ejs', { message: req.flash('forgotMessage'), _csrf: req.csrfToken() });
	});

	app.post('/esqueci', function(req, res, next) {
		User.findOne({ email: req.body.email }, function(err, user) {
			if (err) {
				logger.error('RPE-Error while searching user ' + req.body.email + ': ' + err);
				req.flash('forgotMessage', 'Erro interno ao buscar Email');
				return res.redirect('/esqueci');
			}
			if (!user) {
				logger.info('RPE-User not found: ' + req.body.email);
				req.flash('forgotMessage', 'Email não cadastrado');
				return res.redirect('/esqueci');
			}
			user.resetToken = randomValueBase64(32);
			user.resetValid = Date.now() + 3600000;
			user.save(function(err) {
				if (err) {
					logger.error('RPE-Error while saving user ' + user.email + ': ' + err);
					req.flash('forgotMessage', 'Erro interno ao definir novo token. Favor entrar em contato com ciclosdavida@coldfire.com.br');
					return res.redirect('/esqueci');
				}
				logger.info('RPE-Defined new reset token for user ' + user.email);
				user.sendMail(true);
				req.flash('forgotMessage', 'Um email de confirmação foi enviado para ' + user.email);
				return res.redirect('/esqueci');
			});
		});
    });
	
	app.get('/confirma/:token', function(req, res) {
		User.findOne({ resetToken: req.params.token }, function(err, user) {
			if (err) {
				logger.error('RGCT-Error while searching token ' + req.params.token + ': ' + err);
				req.flash('validationMessage', 'Erro ao localizar Token de validação. Favor entrar em contato com ciclosdavida@coldfire.com.br');
				return res.redirect('/');
			}
			if (!user) {
				logger.info('RGCT-Token not found: ' + req.params.token);
				req.flash('validationMessage', 'Token de validação inválido');
				return res.redirect('/');
			}
			if (user.validated) { // user was already validated. Password reset requested
				logger.verbose('RGCT-User ' + user.email + ' already validated. Forwarding to password reset form');
				if (user.resetValid < Date.now()) {
					logger.warn('RGCT-User ' + user.email + ' using expired token ' + user.resetToken);
					req.flash('validationMessage', 'Token para reset da senha expirado');
					return res.redirect('/');
				}
				res.render('reset.ejs', { message: req.flash('validationMessage'), user: req.user, token: user.resetToken, _csrf: req.csrfToken() });
			} else { // New user
				user.resetToken = undefined;
				user.resetValid = undefined;
				user.validated  = true;
				user.save(function(err) {
					if (err) {
						logger.error('RGCT-Error while validating ' + req.params.token + ' for user ' + user.email + ': ' + err);
						req.flash('validationMessage', 'Erro interno ao validar token. Favor entrar em contato com ciclosdavida@coldfire.com.br');
						return res.redirect('/');
					}
					logger.info('RGCT-Token ' + req.params.token + ' validated for user ' + user.email);
					req.flash('validationMessage', 'Token validado com sucesso. Prossiga com o seu Login');
					return res.redirect('/');
				});
			}
		});
	});

	app.post('/redefinir/:token', function(req, res) {
		User.findOne({ resetToken: req.params.token, resetValid: { $gt: Date.now() } }, function(err, user) {
			if (err) {
				logger.error('RPRT-Error while searching token ' + req.params.token + ': ' + err);
				req.flash('validationMessage', 'Token de redefinição de senha inválido ou expirado');
				return res.redirect('/');
			}
			if (!user) {
				logger.warn('RPRT-Token ' + req.params.token + ' within validity date not found');
				req.flash('validationMessage', 'Token de redefinição de senha inválido ou expirado');
				return res.redirect('/');
			}
			if (!user.validated) { // user was already validated. Password reset requested
				logger.verbose('RPRT-User ' + user.email + ' is not validated. Cannot reset password');
				req.flash('validationMessage', 'Reset da senha para novo usuário não permitido');
				return res.redirect('/');
			}
            user.password = user.generateHash(req.body.password);
			user.resetToken = undefined;
			user.resetValid = undefined;
			user.validated  = false;
			user.save(function(err) {
				if (err) {
					logger.error('RPRT-Error while saving user ' + user.email + ': ' + err);
					req.flash('validationMessage', 'Erro interno ao validar token. Favor entrar em contato com ciclosdavida@coldfire.com.br');
					return res.redirect('/');
				}
				user.sendMail(false);
				logger.info('RPR-Password reset for user ' + user.email);
				req.flash('validationMessage', 'Senha resetada. Um email de confirmação foi enviado.');
				return res.redirect('/');
			});
		});
	});

	app.get('/mapa', isLoggedIn, function(req, res) {
		var data = req.user.dNasc.getUTCDate() + "/" + (req.user.dNasc.getUTCMonth()  + 1)+ "/" + req.user.dNasc.getUTCFullYear();
		if (req.user.superUser) {
			Notification.count({ replied: false }, function(err, conta) {
				if (err) {
					logger.error('RGM-Error while counting notifications: ' + err);
					res.render('ciclo.ejs', { message: req.flash('validationMessage'), data: logic.calcula(data, req.user.nome), user: req.user, notification: 0, _csrf: req.csrfToken() });
				} else {
					res.render('ciclo.ejs', { message: req.flash('validationMessage'), data: logic.calcula(data, req.user.nome), user: req.user, notification: conta, _csrf: req.csrfToken() });
				}
			});
		} else {
			res.render('ciclo.ejs', { message: req.flash('validationMessage'), data: logic.calcula(data, req.user.nome), user: req.user, notification: 0, _csrf: req.csrfToken() });
		}
	});

	app.post('/mapa', isSuperAdmin, function(req, res) {
		Notification.count({ replied: false }, function(err, conta) {
			if (err) {
				logger.error('RGM-Error while counting notifications: ' + err);
				res.render('ciclo.ejs', { message: req.flash('validationMessage'), data: logic.calcula(req.body.data, req.body.nome), user: req.user, notification: 0, _csrf: req.csrfToken() });
			} else {
				res.render('ciclo.ejs', { message: req.flash('validationMessage'), data: logic.calcula(req.body.data, req.body.nome), user: req.user, notification: conta, _csrf: req.csrfToken() });
			}
		});
	});

	
    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/sair', function(req, res) {
        req.logout();
        res.redirect('/');
    });

/*	app.get('/favicon.ico', (req, res) => res.sendStatus(204));  // replaced by serve-favicon */
	
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
