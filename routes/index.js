
var  express     =  require("express"),
passport    =  require('passport'),
User        =  require('../models/user');
Gallery   =  require('../models/gallery');   
router      =  express.Router();
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var multer = require("multer");
var storage = multer.diskStorage({
filename: function(req, file, callback) {
callback(null, Date.now() + file.originalname);
}
});
var imageFilter = function(req, file, cb) {
// accept image files only
if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
return cb(new Error("Only image files are allowed!"), false);
}
cb(null, true);
};
var upload = multer({
storage: storage,
fileFilter: imageFilter
});

var cloudinary = require('cloudinary');
cloudinary.config({ 
cloud_name: 'dr81np8zr', 
api_key: "333537181451896",
api_secret: "J030KUG3VKYzvVauTSYmDclOHdo"
});

/////Initial Routes/////
    router.get("/",function(req,res){
      Gallery.find({}, function(err, allGallery){
      if(err){
        console.log(err);
    } else {
       res.render("landing",{gallery:allGallery});
    }
  });

});

router.get("/about",function(req,res)
{

  res.render("about");
});
 /////autentication logic/////

 //show register form//


 router.get("/register", function(req, res) {
   if (req.user) {
     return res.redirect("/gallery");
   } else {
     res.render("register");
   }
 });

 // handle sign up logic
router.post("/register", upload.single("image"), function(req, res) {
if (req.file === undefined) {
var newUser = new User({
 username: req.body.username,
 email: req.body.email,
 fullName: req.body.fullName,
 image: "",
 imageId: ""
});
User.register(newUser, req.body.password, function(err, user) {
 if (err) {
   return res.render("register", {
     error: err.message
   });
 }
 passport.authenticate("local")(req, res, function() {
   res.redirect("/gallery");
 });
});
} else {
cloudinary.v2.uploader.upload(
 req.file.path, {
   width: 400,
   height: 400,
   gravity: "center",
   crop: "scale"
 },
 function(err, result) {
   if (err) {
     req.flash("error", err.messsage);
     return res.redirect("back");
   }
   req.body.image = result.secure_url;
   req.body.imageId = result.public_id;
   var newUser = new User({
     username: req.body.username,
     email: req.body.email,
     fullName: req.body.fullName,
     image: req.body.image,
     imageId: req.body.imageId
   });
   User.register(newUser, req.body.password, function(err, user) {
     if (err) {
       return res.render("register", {
         error: err.message
       });
     }
     passport.authenticate("local")(req, res, function() {
       res.redirect("/gallery");
     });
   });
 }, {
   moderation: "webpurify"
 }
);
}
});

// user profile
router.get("/users/:user_id", function(req, res) {
User.findById(req.params.user_id, function(err, foundUser) {
if (err || !foundUser) {
 req.flash("error", "This user doesn't exist");
 return res.render("error");
}
Gallery.find()
 .where("author.id")
 .equals(foundUser._id)
 .exec(function(err, gallery) {
   if (err) {
     req.flash("error", "Something went wrong");
     res.render("error");
   }
   Comment.find()
     .where("author.id")
     .equals(foundUser._id)
     .exec(function(err, ratedCount) {
       if (err) {
         req.flash("error", "Something went wrong");
         res.render("error");
       }
       res.render("users/show", {
         user: foundUser,
         gallery: gallery,
         reviews: ratedCount
       });
     });
 });
});
});

// edit profile
router.get(
"/users/:user_id/edit",
middleware.isLoggedIn,
middleware.checkProfileOwnership,
function(req, res) {
res.render("users/edit", {
 user: req.user
});
}
);

// update profile
router.put(
"/users/:user_id",
upload.single("image"),
middleware.checkProfileOwnership,
function(req, res) {
User.findById(req.params.user_id, async function(err, user) {
 if (err) {
   req.flash("error", err.message);
 } else {
   if (req.file) {
     try {
       await cloudinary.v2.uploader.destroy(user.imageId);
       var result = await cloudinary.v2.uploader.upload(req.file.path, {

       });
       user.imageId = result.public_id;
       user.image = result.secure_url;
     } catch (err) {
       req.flash("error", err.message);
       return res.redirect("back");
     }
   }
   user.email = req.body.email;
   user.fullName = req.body.fullName;
   user.save();
   req.flash("success", "Updated your profile!");
   res.redirect("/users/" + req.params.user_id);
 }
});moderation = "webpurify"
}
);

// delete user
router.delete("/users/:user_id", middleware.checkProfileOwnership, function(
req,
res
) {
User.findById(req.params.user_id, async function(err, user) {
if (err) {
 req.flash("error", err.message);
 return res.redirect("back");
}
if (user.image === "") {
 user.remove();
 res.redirect("/");
} else {
 try {
   await cloudinary.v2.uploader.destroy(user.imageId);
   user.remove();
   res.redirect("/");
 } catch (err) {
   if (err) {
     req.flash("error", err.message);
     return res.redirect("back");
   }
 }
}
});
});

 /////login configuration/////
 router.get("/login", function(req, res) {
   if (req.user) {
     return res.redirect("/gallery");
   } else {
     res.render("login");
   }
 });


 router.post("/login",passport.authenticate("local",{

       successRedirect : "/gallery",
       failureRedirect : "/login"


 }),function(req,res){


 });


 //////logout configuration/////

 router.get("/logout",function(req,res){

    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/gallery");
  

 });


 // forgot password
router.get('/forgot', function(req, res) {
res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
async.waterfall([
function(done) {
 crypto.randomBytes(20, function(err, buf) {
   var token = buf.toString('hex');
   done(err, token);
 });
},
function(token, done) {
 User.findOne({ email: req.body.email }, function(err, user) {
   if (!user) {
     req.flash('error', 'No account with that email address exists.');
     return res.redirect('/forgot');
   }

   user.resetPasswordToken = token;
   user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

   user.save(function(err) {
     done(err, token, user);
   });
 });
},
function(token, user, done) {
 var smtpTransport = nodemailer.createTransport({
   service: 'Gmail', 
   auth: {
     user: 'mayanksunal@gmail.com',
     pass: process.env.PASSWORD
   }
 });
 var mailOptions = {
   to: user.email,
   from: 'mayanksunal@gmail.com',
   subject: 'project Password Reset',
   text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
     'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
     'http://' + req.headers.host + '/reset/' + token + '\n\n' +
     'If you did not request this, please ignore this email and your password will remain unchanged.\n'
 };
 smtpTransport.sendMail(mailOptions, function(err) {
   console.log('mail sent');
   req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
   done(err, 'done');
 });
}
], function(err) {
if (err) return next(err);
res.redirect('/forgot');
});
});

router.get('/reset/:token', function(req, res) {
User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
if (!user) {
 req.flash('error', 'Password reset token is invalid or has expired.');
 return res.redirect('/forgot');
}
res.render('reset', {token: req.params.token});
});
});

router.post('/reset/:token', function(req, res) {
async.waterfall([
function(done) {
 User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
   if (!user) {
     req.flash('error', 'Password reset token is invalid or has expired.');
     return res.redirect('back');
   }
   if(req.body.password === req.body.confirm) {
     user.setPassword(req.body.password, function(err) {
       user.resetPasswordToken = undefined;
       user.resetPasswordExpires = undefined;

       user.save(function(err) {
         req.logIn(user, function(err) {
           done(err, user);
         });
       });
     })
   } else {
       req.flash("error", "Passwords do not match.");
       return res.redirect('back');
   }
 });
},
function(user, done) {
 var smtpTransport = nodemailer.createTransport({
   service: 'Gmail', 
   auth: {
     user: 'mayanksunal@gmail.com',
     pass: process.env.PASSWORD
   }
 });
 var mailOptions = {
   to: user.email,
   from: 'mayanksunal@gmail.com',
   subject: 'Your password has been changed',
   text: 'Hello,\n\n' +
     'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
 };
 smtpTransport.sendMail(mailOptions, function(err) {
   req.flash('success', 'Success! Your password has been changed.');
   done(err);
 });
}
], function(err) {
res.redirect('/gallery');
});
});



 //middleware
 function isLoggedIn(req, res, next){
   if(req.isAuthenticated()){
     return next();
   }
   res.redirect("/login");
 }
   

module.exports  =  router;


 // forgot password
router.get('/forgot', function(req, res) {
res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
async.waterfall([
function(done) {
 crypto.randomBytes(20, function(err, buf) {
   var token = buf.toString('hex');
   done(err, token);
 });
},
function(token, done) {
 User.findOne({ email: req.body.email }, function(err, user) {
   if (!user) {
     req.flash('error', 'No account with that email address exists.');
     return res.redirect('/forgot');
   }

   user.resetPasswordToken = token;
   user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

   user.save(function(err) {
     done(err, token, user);
   });
 });
},
function(token, user, done) {
 var smtpTransport = nodemailer.createTransport({
   service: 'Gmail', 
   auth: {
     user: 'mayanksunal@gmail.com',
     pass: process.env.PASSWORD
   }
 });
 var mailOptions = {
   to: user.email,
   from: 'mayanksunal@gmail.com',
   subject: 'project Password Reset',
   text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
     'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
     'http://' + req.headers.host + '/reset/' + token + '\n\n' +
     'If you did not request this, please ignore this email and your password will remain unchanged.\n'
 };
 smtpTransport.sendMail(mailOptions, function(err) {
   console.log('mail sent');
   req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
   done(err, 'done');
 });
}
], function(err) {
if (err) return next(err);
res.redirect('/forgot');
});
});

router.get('/reset/:token', function(req, res) {
User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
if (!user) {
 req.flash('error', 'Password reset token is invalid or has expired.');
 return res.redirect('/forgot');
}
res.render('reset', {token: req.params.token});
});
});

router.post('/reset/:token', function(req, res) {
async.waterfall([
function(done) {
 User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
   if (!user) {
     req.flash('error', 'Password reset token is invalid or has expired.');
     return res.redirect('back');
   }
   if(req.body.password === req.body.confirm) {
     user.setPassword(req.body.password, function(err) {
       user.resetPasswordToken = undefined;
       user.resetPasswordExpires = undefined;

       user.save(function(err) {
         req.logIn(user, function(err) {
           done(err, user);
         });
       });
     })
   } else {
       req.flash("error", "Passwords do not match.");
       return res.redirect('back');
   }
 });
},
function(user, done) {
 var smtpTransport = nodemailer.createTransport({
   service: 'Gmail', 
   auth: {
     user: 'mayanksunal@gmail.com',
     pass: process.env.PASSWORD
   }
 });
 var mailOptions = {
   to: user.email,
   from: 'mayanksunal@gmail.com',
   subject: 'Your password has been changed',
   text: 'Hello,\n\n' +
     'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
 };
 smtpTransport.sendMail(mailOptions, function(err) {
   req.flash('success', 'Success! Your password has been changed.');
   done(err);
 });
}
], function(err) {
res.redirect('/gallery');
});
});



 //middleware
 function isLoggedIn(req, res, next){
   if(req.isAuthenticated()){
     return next();
   }
   res.redirect("/login");
 }
   

module.exports  =  router;