/*!
 * ciclosdavida
 * Copyright(c) 2015 Andre Luis Arantes Monteiro <dev@andrelam.com.com>
 * MIT Licensed
 */
/**
 * Module dependencies
 */

var express = require('express');
var app = express();
var mongoose = require('mongoose');
var passport = require('passport');
var config = require('./config/setup.js');
var logger = require('./config/logger');

var port = process.env.PORT || 2000;

// configuration ===============================================================
mongoose.Promise = global.Promise;
mongoose.set('strictQuery', false);

mongoose.connection.on('error', function(err) {
    logger.error('MongoDB connection error: ' + err);
});

mongoose.connection.on('disconnected', function() {
    logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', function() {
    logger.info('MongoDB reconnected');
});

function startApplication() {
    mongoose.connect(config.dbUrl)
    .then(() => {
        logger.info('MongoDB connected');

        var mongoClient = mongoose.connection.getClient();

        // Bootstrap application settings
        require('./config/express')(app, passport, mongoClient);

        require('./config/passport')(passport);

        // required for passport
        app.use(passport.initialize());
        app.use(passport.session());

        // routes
        require('./config/routes.js')(app, passport);

        app.listen(port);
        logger.info('Express app started on port ' + port);
    })
    .catch((err) => {
        logger.error('MongoDB could not connect: ' + err);
        setTimeout(startApplication, 1000);
    });
}

startApplication();

/**
 * Expose
 */

module.exports = app;
