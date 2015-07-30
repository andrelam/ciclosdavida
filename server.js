/*!
 * ciclosdavida
 * Copyright(c) 2015 Andre Luis Arantes Monteiro <dev@andrelam.com.com>
 * MIT Licensed
 */
/**
 * Module dependencies
 */

var fs = require('fs');
var express = require('express');
var app = express();
var logic = require('./config/logic');
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var config = require('./config/setup.js');

var port = process.env.PORT || 3000;

// configuration ===============================================================
mongoose.connect(config.dbUrl); // connect to our database

// require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session(config.secret)); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


// Bootstrap application settings
require('./config/express')(app);

app.get('/', function(req, res) {
	res.render('index.ejs', { message: req.flash('validationMessage') });
});

app.post('/', function(req, res) {
	var hoje = new Date();
	hoje.setTime(hoje.getTime() + hoje.getTimezoneOffset() * 60 * 1000);
	hoje.setMilliseconds(0);
	hoje.setSeconds(0);
	hoje.setMinutes(0);
	hoje.setHours(0);
	
	res.render('ciclo.ejs', { message: req.flash('validationMessage'), data: logic.calcula(req.body) });
});

app.get('*', function(req, res) {
	res.redirect('/');
});

app.listen(port);
console.log('Express app started on port ' + port);

/**
 * Expose
 */

module.exports = app;
