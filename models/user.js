// models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var BCRYPT_ROUNDS = 12;

var nodemailer = require('nodemailer');
var emailTempl = require('email-templates');
var path       = require('path');
var templConf  = path.resolve(__dirname, '../views/mail', 'confirm');
var templReset = path.resolve(__dirname, '../views/mail', 'reset');
var config     = require('../config/setup.js');
var logger     = require('../config/logger');

var userSchema = mongoose.Schema( {
    email     : { type: String, required: true, unique: true, trim: true },
    password  : { type: String, required: true },
    nome      : { type: String, required: true, trim: true },
    dNasc     : { type: Date, required: true },
    resetToken: { type: String, required: false },
    resetValid: { type: Date, required: false },
    validated : { type: Boolean, default: false },
    premium   : { type: Boolean, default: false },
    superUser : { type: Boolean, default: false },
    lastLogin : { type: Date, required: false }
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compare(password, this.password);
};

userSchema.methods.passwordNeedsRehash = function() {
    return bcrypt.getRounds(this.password) < BCRYPT_ROUNDS;
};

userSchema.methods.sendMail = function(reset) {
    var smtp = nodemailer.createTransport(config.nodemailer.transport);

    var template;
    var titulo;

    if (reset) {
        template = 'reset';
        titulo = 'Reinicialize sua senha';
    } else {
        template = 'confirm';
        titulo = 'Confirme seu registro';
    };

    var html;

    var user = this;

    var email = new emailTempl(
        { views: {
            root: path.resolve(__dirname, '../views/mail'),
            options: {
                extension: 'ejs'
            }
        }
    });

    email
    .render(template, user)
    .then(html => {

        var mailOptions = {
            to     : user.email.toLowerCase(),
            from   : config.nodemailer.defaultFrom,
            subject: titulo,
            html   : html
        };
        smtp.sendMail(mailOptions, function(err) {
            if (err)
                logger.error('US-Error while sending email to ' + user.email.toLowerCase() + ': ' + err);
        });
        return;
    })
    .catch(err => {
        logger.error('US-Error while rendering template ' + template + ' to be sent to user ' + user.email.toLowerCase() + ': ' + err);
    });

    return;
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
