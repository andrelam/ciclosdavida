// models/loginHistory.js
// load the things we need
var mongoose = require('mongoose');
var path     = require('path');
var config   = require('../config/setup.js');
var Schema   = mongoose.Schema;

var loginhistorySchema = mongoose.Schema( {
	userId    : { type: Schema.Types.ObjectId, ref: 'User' },
	loginDate : { type: Date, required: true },
	success   : Boolean
});

loginhistorySchema.methods.newLogin = function(user, success) {
	this.userId    = user._id;
	this.loginDate = Date.now();
	this.success   = success;
	this.save(function(err) {
		if (err)
			throw err;
	});
	return;
};


// create the model for LoginHistory and expose it to our app
module.exports = mongoose.model('LoginHistory', loginhistorySchema);
