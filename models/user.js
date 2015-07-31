// models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var nodemailer = require('nodemailer');
var emailTempl = require('email-templates').EmailTemplate;
var path       = require('path');
var templConf  = path.resolve(__dirname, '../views/mail', 'confirm');
var templReset = path.resolve(__dirname, '../views/mail', 'reset');
var config     = require('../config/setup.js');

var userSchema = mongoose.Schema( {
	email     : { type: String, required: true, unique: true },
	password  : { type: String, required: true },
	nome      : { type: String, required: true },
	dNasc     : { type: Date, required: true },
	resetToken: String,
	resetValid: Date,
	validated : { type: Boolean, default: false },
	premium   : { type: Boolean, default: false },
	superUser : { type: Boolean, default: false }
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

userSchema.methods.sendMail = function(reset) {
	var smtp = nodemailer.createTransport(config.nodemailer.transport);

	var template;
	var titulo;

	if (reset) {
		template = new emailTempl(templReset);
		titulo = 'Reinicialize sua senha';
	} else {
		template = new emailTempl(templConf);
		titulo = 'Confirme seu registro';
	}

	var html;

	var user = this;
	
	template.render(user, function(err, result) {
		if (err) {
			console.log(err);
			return;
		}

		html = result.html;

		var mailOptions = {
			to     : user.email,
			from   : config.nodemailer.defaultFrom,
			subject: titulo,
			html   : html
		};
		smtp.sendMail(mailOptions, function(err) {
			if (err)
				console.log(err);
		});
		return;
	});

	return;
}

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
