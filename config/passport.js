﻿// config/passport.js

// load all the things we need
var LocalStrategy = require('passport-local').Strategy;

// load up the user model
var User = require('../models/user');
var LoginHistory = require('../models/loginHistory');

var crypto = require('crypto');
var logger = require('./logger');

// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {

        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'email' :  email }, function(err, user) {
            // if there are any errors, return the error
            if (err) {
				logger.error('Error while looking up for user ' + email + ': ' + err);
                return done(err);
			}

            // check to see if there's already a user with that email
            if (user) {
				logger.info('Attempt to re-create user ' + email);
                return done(null, false, req.flash('signupMessage', 'E-mail já cadastrado'));
            } else {

				logger.debug('Creating user ' + email);
                // if there is no user with that email
                // create the user
                var newUser      = new User();

                // set the user's local credentials
                newUser.email    = email;
                newUser.password = newUser.generateHash(password);
				newUser.nome     = req.body.nome;
				var re = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

				var dataNasc = req.body.data.match(re);
				var dataNascStr = dataNasc[2] + '/' + dataNasc[1] + '/' + dataNasc[3];
				
				var dataNascimento = new Date(dataNascStr);
				newUser.dNasc      = dataNascimento;
				newUser.resetToken = randomValueBase64(32);
				newUser.validated  = false;
				newUser.premium    = false;
				newUser.superUser  = false;
				
                // save the user
                newUser.save(function(err) {
                    if (err) {
						logger.error('Error while creating user ' + email + ': ' + err);
                        throw err;
					}
					logger.info('Created user ' + email);
					newUser.sendMail(false);
                    return done(null, false, req.flash('validationMessage', 'Um email de confirmação foi enviado para ' + newUser.email));
                });
            }

        });    

        });

    }));


    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'email' :  email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err) {
				logger.error('Error while looking up for user ' + email + ': ' + err);
                return done(err);
			}

            // if no user is found, return the message
            if (!user) {
				logger.info('Attempt to log with non-existant user ' + email);
                return done(null, false, req.flash('loginMessage', 'Usuário ou senha inválidos.')); // req.flash is the way to set flashdata using connect-flash
			}

			var loginHistory = new LoginHistory();
			
            // if the user is found but the password is wrong
            if (!user.validPassword(password)) {
				logger.warn('Attempt to log with user ' + email + ' with wrong password');
				loginHistory.newLogin(user, false);
                return done(null, false, req.flash('loginMessage', 'Usuário ou senha inválidos.')); // create the loginMessage and save it to session as flashdata
			}

			// update last login data
			user.resetToken = undefined;
			user.resetValid = undefined;
			user.lastLogin = Date.now();

			user.save(function(err) {
				if (err) {
					logger.error('Error while saving user ' + email + ': ' + err );
					return done(null, false, req.flash('loginMessage', 'Usuário ou senha inválidos.')); // create the loginMessage and save it to session as flashdata
				}
			});

			logger.info('New login by user ' + email);
			loginHistory.newLogin(user, true);
			
            // all is well, return successful user
            return done(null, user);
        });

    }));

};


function randomValueBase64 (len) {
	return crypto.randomBytes(Math.ceil(len * 3 / 4))
		.toString('base64')   // convert to base64 format
		.slice(0, len)        // return required number of characters
		.replace(/\+/g, '0')  // replace '+' with '0'
		.replace(/\//g, '0'); // replace '/' with '0'
}
