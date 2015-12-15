var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { username : req.session.username });
});

// //REGISTER GET
router.get('/register', function(req, res, next){
	res.render('register',{ });
});

//REGISTER POST when user submits it will go through this route .post
router.post('/register', function(req, res, next){
	Account.register(new Account(
		{username: req.body.username}),
		//from the body parser module in app.js
		req.body.password,
		//we don't have password: because we dont' want to save the pw
		function(error, account){
			if(error){
				console.log(error);
				return res.render('index');
			}else{
				passport.authenticate('local')(req, res, function(){
					//using the local method to authenticate
					req.session.username = req.body.username;
					//fast way to get username w/o getting in db
					res.redirect('/')
				})
			}
		});
});


//LOGIN GET
//Get the login page
router.get('/login', function(req, res, next){

	//the user is already logged in
	if(req.session.username){
		resdirect('/choices');
	}
	//req.query.login pulls the query parameters right out of the http headers!
    //They are here and failed a login
	if(req.query.failedlogin){
		res.render('login', { failed: "Your username or password is incorrect."});
	}
	//They are here and aren't logged in
	res.render('login', { user : req.user });
})


//LOGIN POST
router.post('/login', passport.authenticate('local'), function(req, res, next){
	if(req.body.getStarted){
		Account.register(new Account({ username : req.body.username}), req.body.password, function(err, account) {
			if (err) {
				return res.render('register', { err : err });
			}
			if(!err)
			passport.authenticate('local')(req, res, function() {
				req.session.username = req.body.username;
				res.render('choices', { username : req.session.username });
			});
		});
	}
	req.session.username = req.body.username;
	res.render('login');
})



module.exports = router;
