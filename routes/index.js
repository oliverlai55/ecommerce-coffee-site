var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { username : req.session.username });
});

//////////////////////////
//////REGISTER GET////////
router.get('/register', function(req, res, next){
	res.render('register',{ });
});

////////////////REGISTER////////////////

//REGISTER POST when user submits it will go through this route .post
//it POST TO the register page
router.post('/register', function(req, res, next){
	//the mongo statement to insert the new vars into the db
	Account.register(new Account(
		{username: req.body.username}),
		//from the body parser module in app.js
		req.body.password,
		//we don't have password: because we dont' want to save the pw
		function(error, account){
			if(error){
				console.log(error);
				return res.render('register', { error : error });
			}else{
				passport.authenticate('local')(req, res, function(){
					//using the local method to authenticate
					req.session.username = req.body.username;
					//fast way to get username w/o getting in db
					// session module of express
					res.render('index', { username : req.session.username });
				});
			}
		});
});

/////LOGIN GET////

//Get the login page
router.get('/login', function(req, res) {

	//the user is already logged in
	if(req.session.username){
		res.redirect('/index');
	}
	//req.query.login pulls the query parameters right out of the http headers!
    //They are here and failed a login
	if(req.query.failedlogin){
		res.render('login', { failed: "Your username or password is incorrect." });
	}
	//They are here and aren't logged in
	res.render('login', { });
})


/////////LOGIN POST//////////
router.post('/login', function(req, res, next) {

      passport.authenticate('local', function(err, user, info) {
        if (err) {
          return next(err); // will generate a 500 error
        }
        // Generate a JSON response reflecting authentication status
        if (! user) {
          return res.redirect('/login?failedlogin=1');
        }
        if (user){
            // Passport session setup.
            passport.serializeUser(function(user, done) {
              console.log("serializing " + user.username);
              done(null, user);
            });

            passport.deserializeUser(function(obj, done) {
              console.log("deserializing " + obj);
              done(null, obj);
            });        
            req.session.username = user.username;
        }

        return res.redirect('/');
      })(req, res, next);
});


//// Logout////
router.get('/logout', function(req, res) {
	req.session.destroy();
	res.redirect('/');
});



//////CHOICES GET////////
/////////////////////////
router.get('/choices', function (req, res, next){
	//Make sure the user is logged in
	if(req.session.username){
		//they do belong here, proceed with page
		//check and see if they have any set preferences already
		res.render('choices');
	}else{
		res.redirect('/')
	}
});






module.exports = router;
