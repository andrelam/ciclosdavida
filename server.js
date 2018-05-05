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
var mongoose = require('mongoose');
var passport = require('passport');
var mercadopago = require('mercadopago');

var config = require('./config/setup.js');

var port = process.env.PORT || 2000;

// configuration ===============================================================
mongoose.connect(config.dbUrl); // connect to our database

mongoose.Promise = global.Promise;

var db = mongoose.connection;

const connectWithRetry = () => {
	console.log('MongoDB connection with retry');
	return mongoose.connect(config.dbUrl);
};

db.on('error', err => {
	console.log('MongoDB connection error: ${err}');
	setTimeout(connectWithRetry, 1000);
});

db.on('connected', () => {
	console.log('MongoDB connected');
});

//mercadopago.configure(config.mercadopago);

// Bootstrap application settings
require('./config/express')(app);

require('./config/passport')(passport); // pass passport for configuration

// required for passport
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

// routes ======================================================================
require('./config/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

app.listen(port);
console.log('Express app started on port ' + port);

/**
 * Expose
 */

module.exports = app;
