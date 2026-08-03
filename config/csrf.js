var { doubleCsrf } = require('csrf-csrf');
var config = require('./setup');

var {
    generateCsrfToken,
    doubleCsrfProtection,
    invalidCsrfTokenError
} = doubleCsrf({
    getSecret: function() {
        return config.secret;
    },
    getSessionIdentifier: function(req) {
        return req.session.id;
    },
    cookieName: 'XSRF-TOKEN',
    cookieOptions: {
        httpOnly: false,
        sameSite: 'lax',
        secure: true
    },
    getCsrfTokenFromRequest: function(req) {
        return req.body && req.body._csrf;
    },
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS']
});

module.exports = {
    generateCsrfToken,
    doubleCsrfProtection,
    invalidCsrfTokenError
};
