var config = require('./setup');
var winston = require('winston');

var level = process.env.LOG_LEVEL || config.logging.level || 'debug';

var logger = winston.createLogger({
    level: level,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(function(info) {
            return info.timestamp + ' - ' + info.level + ': ' + info.message;
        })
    ),
    transports: [
        new winston.transports.Console()
    ]
});

module.exports = logger;
