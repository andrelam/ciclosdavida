// models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

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

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
