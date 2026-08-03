var { doubleCsrf } = require('csrf-csrf');
var config = require('./setup');

/*
 * CSRF protection uses the double submit cookie pattern.
 *
 * A token is generated and stored in the XSRF-TOKEN cookie, while the same
 * value is sent back through a hidden form field named "_csrf".
 * State-changing requests are validated by comparing both values.
 */

var {
    generateCsrfToken,
    doubleCsrfProtection
} = doubleCsrf({
    getSecret: function() {
        return config.secret;
    },
    getSessionIdentifier: function(req) {
        return req.session.id;
    },
    cookieName: 'XSRF-TOKEN',
    cookieOptions: {
        /*
         * The CSRF token is stored both in the XSRF-TOKEN cookie and in a
         * hidden form field (_csrf). The application uses the double submit
         * cookie pattern, where the token from the request body must match
         * the token stored in the cookie.
         *
         * Therefore, the CSRF cookie cannot be marked as httpOnly, as the
         * client must be able to access the token when submitting requests.
         */
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
    doubleCsrfProtection
};
