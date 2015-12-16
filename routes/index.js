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
		res.redirect('/choices');
	}
	//req.query.login pulls the query parameters right out of the http headers!
    //They are here and failed a login
	if(req.query.failedlogin){
		res.render('login', { failed: "Your username or password is incorrect." });
	}
	//They are here and aren't logged in
	res.render('login', { });
})

/////////////////////////////
/////////LOGIN POST//////////
router.post('/login', function(req, res, next) {

   if(req.body.getStarted){
       Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
           if (err) {
               return res.render('register', { err : err });
           }
           if(!err)
           passport.authenticate('local')(req, res, function () {
               req.session.username = req.body.username;
               res.render('choices', { username : req.session.username });
           });
       });        
   }

   if (!req.body.getStarted){
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

       return res.redirect('/choices');
     })(req, res, next);
   }
});
// router.post('/login', function(req, res, next) {

//       passport.authenticate('local', function(err, user, info) {
//         if (err) {
//           return next(err); // will generate a 500 error
//         }
//         // Generate a JSON response reflecting authentication status
//         if (! user) {
//           return res.redirect('/login?failedlogin=1');
//         }
//         if (user){
//             // Passport session setup.
//             passport.serializeUser(function(user, done) {
//               console.log("serializing " + user.username);
//               done(null, user);
//             });

//             passport.deserializeUser(function(obj, done) {
//               console.log("deserializing " + obj);
//               done(null, obj);
//             });        
//             req.session.username = user.username;
//         }

//         return res.redirect('/');
//       })(req, res, next);
// });


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
		Account.findOne({ username: req.session.username },
			function (err, doc){
				var currGrind = doc.grind ? doc.grind : undefined
				var currFrequency = doc.frequency ? doc.frequency : undefined
				var currPounds = doc.pounds ? doc.pounds : undefined
			//ternary conditional
			// currGrind will set to doc.grind if true, or undefined if false

				res.render('choices',{
				 username : req.session.username,
				 grind : currGrind,
				 frequency : currFrequency,
				 pounds : currPounds 
				});
			});

	}else{
		res.redirect('/')
	}
});

/////////////////////////////
//////CHOICES POST///////////
router.post('/choices', function (req, res, next){
	//see if the person is logged in
	if(req.session.username){
		var newGrind = req.body.grind;
		var newFrequency = req.body.frequency;
		var newPounds = req.body.quarterPounds;

		Account.findOneAndUpdate(
			{ username: req.session.username },
			{ grind: newGrind },
			{ upsert: true },
				//it means if it doesn't exist, creat it, or update it
			function (err, account){
				if (err) {
					res.send("There was an error saving your preferences.  Please re-enter or send this error to our help team: " + err)
				}else{
					console.log("==========")
					console.log(account)
					console.log("==========")
					account.save;
				}
			}

		)
		Account.findOneAndUpdate(
			{ username: req.session.username },
			{ frequency: newFrequency },
			{ upsert: true },
				//it means if it doesn't exist, creat it, or update it
			function (err, account){
				if (err) {
					res.send("There was an error saving your preferences.  Please re-enter or send this error to our help team: " + err)
				}else{
					console.log("==========")
					console.log(account)
					console.log("==========")
					account.save;
				}
			}

		)
		Account.findOneAndUpdate(
			{ username: req.session.username },
			{ pounds: newPounds },
			{ upsert: true },
				//it means if it doesn't exist, creat it, or update it
			function (err, account){
				if (err) {
					res.send("There was an error saving your preferences.  Please re-enter or send this error to our help team: " + err)
				}else{
					console.log("==========")
					console.log(account)
					console.log("==========")
					account.save;
				}
			}
		)
		res.redirect('/delivery');
	}

});

router.get('/delivery', function (req, res, next){
	res.send("<h1>Welcome to the delivery page.</h1>");
});



module.exports = router;
