var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var router = express.Router();
var nodemailer = require('nodemailer');
// var vars = require('../config/vars.json');
var stripe = require('stripe')(
	'sk_test_lGVN1R3LkUOb0w5PX7cV0JpS'
);

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

	passport.authenticate('local', function (err, user, info){
		if (err) {
			return next(err); //will generate a 500 error
		}
		//Generate a JSON response reflecting authentication status
       if (! user) {
         return res.redirect('/login?failedlogin=1');
       }
       if (user){
       		if(user.accessLevel == 5) {//level 5 = Admin
       			req.session.accessLevel = "Admin";
       		}
       		req.session.username = user.username;
       	}

       	return res.redirect('/choices');
      })(req, res, next);
});

/////////////////////////////
//// Logout GET//////////////
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
				//render the choices view
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
			{ username : req.session.username },
			{ pounds : newPounds,
			 frequency : newFrequency,
			 grind : newGrind },
			{ upsert : true },
				//it means if it doesn't exist, creat it, or update it
			function (err, account){
				if (err) {
					res.send("There was an error saving your preferences.  Please re-enter or send this error to our help team: " + err)
				}else{
					account.save;
				}
			}
		)
		res.redirect('/delivery');
	}
});

/////////////////////////////////
////////DELIVERY GET/////////////
router.get('/delivery', function (req, res, next){
	if(req.session.username){
		Account.findOne({ username: req.session.username },
			function (err, doc){
				var currFullName = doc.fullName ? doc.fullName : ''
				var currAddress1 = doc.address1 ? doc.address1 : ''
				var currAddress2 = doc.address2 ? doc.address2 : ''
				var currCity = doc.city ? doc.city : ''
				var currState = doc.state ? doc.state : ''
				var currZipCode = doc.zipCode ? doc.zipCode : ''
				var currDeliveryDate = doc.deliveryDate ? doc.deliveryDate : ''
				res.render( 'delivery', {
					username: req.session.username,
					fullName: currFullName,
					address1: currAddress1,
					address2: currAddress2,
					city: currCity,
					state: currState,
					zipCode: currZipCode,
					delivery: currDeliveryDate
				});
			});

	}else{
		res.redirect('/login')
	}
});

////////////////////////////////
/////////DELIVERY POST//////////
router.post('/delivery', function (req, res, next){
	if(req.session.username){
		var newFullName = req.body.fullName
		var newAddress1 = req.body.address1
		var newAddress2 = req.body.address2
		var newCity = req.body.city
		var newState = req.body.state
		var newZipCode = req.body.zipCode
		var newDeliveryDate = req.body.deliveryDate

		var updateList = {
			fullName: newFullName,
			address1: newAddress1,
			addresss2: newAddress2,
			city: newCity,
			state: newState,
			zipCode: newZipCode,
			deliveryDate: newDeliveryDate
		}

		Account.findOneAndUpdate({username: req.session.username},
			updateList,
			{upsert: true},
			function (err, account){
				if (err){
					res.send('There was an error saving your preference. Please re-enter your order details. ERROR: ' + err)
				}else{
					account.save;
				}
			});
			res.redirect('/payment')
	}else{
		res.redirect('/login');
	}
})

/////////////////////////////////
////////ACCOUNT PAGE/////////////
router.get('/account', function (req, res, next){
	if(req.session.username){
		Account.findOne({username: req.session.username},
			function (err, doc){
				var currAddress1 = doc.address1
				var currAddress2 = doc.address2
				var currFullName = doc.fullName
				var currCity = doc.city
				var currState = doc.state
				var currZipCode = doc.zipCode
				var currGrind = doc.grind
				var currFrequency = doc.frequency
				var currPounds = doc.pounds
				var currDeliveryDate = doc.deliveryDate

				res.render('account', {
					username: req.session.username,
					fullName: currFullName,
					address1: currAddress1,
					address2: currAddress2,
					city: currCity,
					state: currState,
					zipCode: currZipCode,
					deliveryDate: currDeliveryDate,
					grind: currGrind,
					frequency: currFrequency,
					pounds: currPounds
				});
			});
	}else{
		// req.session.route = req.url
		res.redirect('/login');
	}
});




/////////////////////////////////
////////Payment GET//////////////
router.get('/payment', function (req, res, next){
    //If the user is logged in...
    if(req.session.username){
        Account.findOne({ "username": req.session.username}, function (err, doc, next){
            var currFullName = doc.fullName ? doc.fullName : undefined;
            var currAddress1 = doc.address1 ? doc.address1 : undefined;
            var currAddress2 = doc.address2 ? doc.address2 : undefined;
            var currCity = doc.city ? doc.city : undefined;
            var currState = doc.city ? doc.state : undefined;
            var currZipCode = doc.zipCode ? doc.zipCode : undefined;    	
          	var currDeliveryDate = doc.deliveryDate ? doc.deliveryDate : undefined
            var currGrind = doc.grind
            var currFrequency = doc.frequency
            var currPounds = doc.pounds

            res.render( 'payment', {
                username: req.session.username,
                fullName: currFullName,
                address1: currAddress1,
                address2: currAddress2,
                city: currCity,
                state: currState,
                zipCode: currZipCode,
                deliveryDate: currDeliveryDate,
                grind: currGrind,
                frequency: currFrequency,
                pounds: currPounds
            });
        });
    }    
    if(!req.session.username){
        //The user is not logged in. Send them to the login page.
        res.redirect('/login');
    }    
});

/////////////////////////////
///////Payment POST/////////
router.post('/payment', function (req, res, next){
	if(!req.session.username){
		// req.session.route = req.url
		res.redirect('/login');
	}else{

		// res.json(req.body);
		stripe.charges.create({
			amount: 400,
			currency: "usd",
		source: req.body.stripeToken, //Obtained with Stripe.js
		description: "Charge for " + req.body.stripeEmail
	}, function (err, charge){
		//asynchronously called
		console.log(charge)
		if(err){
			res.send('you got an error.' + err)
		}else{
			res.redirect('/thankyou')
		}
	});
	}
});

router.get('/thankyou', function (req, res, next){
	if(!req.session.username){
		res.redirect('/login');
	}else{
        Account.findOne({ "username": req.session.username}, function (err, doc, next){
            var currFullName = doc.fullName ? doc.fullName : undefined;
            var currAddress1 = doc.address1 ? doc.address1 : undefined;
            var currAddress2 = doc.address2 ? doc.address2 : undefined;
            var currCity = doc.city ? doc.city : undefined;
            var currState = doc.city ? doc.state : undefined;
            var currZipCode = doc.zipCode ? doc.zipCode : undefined;    	
          	var currDeliveryDate = doc.deliveryDate ? doc.deliveryDate : undefined
            var currGrind = doc.grind
            var currFrequency = doc.frequency
            var currPounds = doc.pounds

            res.render( 'thankyou', { username: req.session.username });
        });
       
	}
});
//////////////////////////////////
//////////Email GET///////////////
// router.get('/email', function (req, res, next){
// 	var transporter = nodemailer.createTransport({
// 		service: 'Gmail',
// 		auth: {
// 			user: vars.email,
// 			pass: vars.password
// 		}
// 	});
// 	var text = "This is a test email sent from my node server";
// 	var mailOptions = {
// 		from: body.req.name + '<' + body.req.email + '>',
// 		to: 'Oliver Lai <oliverlai55@gmail.com>',
// 		subject: 'This is a test subject',
// 		text: req.body.message + ' this email is from: '
// 	}

// 	transporter.sendMail(mailOptions, function(error, info){
// 		if(error){
// 			console.log(error);
// 			res.json({response: error});
// 		}else{
// 			console.log("Message was successfully sent. Response was " + info.response);
// 			res.json({response: "success"});
// 		}
// 	})

// });

////////////////////////////////////
//////////Contact GET///////////////
router.get('/contact', function (req, res, next){
	res.render('contact');
});

////////////////////////////////////
//////////ADMIN GET///////////////
router.get('/admin', function (req, res, next){
	if(req.session.accessLevel == "Admin"){
		
		Account.find({}, function (err, doc, next){

			res.render('admin', {accounts: doc});
		});
		
	}else{
		//user doesn't belong here
		res.redirect('/');
	}
});

module.exports = router;
