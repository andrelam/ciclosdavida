//Routes

var logic = require('./logic');

module.exports = function(app, passport) {

	app.get('/', function(req, res) {
		res.render('index.ejs', { message: req.flash('validationMessage') });
	});


	// =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/acessar', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') }); 
    });

    // process the login form
    // app.post('/acessar', do all our passport stuff here);

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/registro', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

	app.post('/registro', passport.authenticate('local-signup', {
		successRedirect : '/', // redirect to the secure profile section
		failureRedirect : '/registro', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
    }));

	
	app.get('/mapa', isLoggedIn, function(req, res) {
		res.render('ciclo.ejs', { message: req.flash('validationMessage'), data: logic.calcula(req.body, req.user) });
	});
  
    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

	
	app.get('*', function(req, res) {
		res.redirect('/');
	});

}

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
