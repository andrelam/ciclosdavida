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
var logic = require('./config/logic');

var app = express();
var port = process.env.PORT || 3000;

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
