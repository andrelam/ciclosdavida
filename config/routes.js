//Routes

var logic = require('./logic');

module.exports = function(app, passport) {

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

}