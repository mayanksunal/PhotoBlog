require("dotenv").config();
var express    =    require("express"),
mongoose       =    require("mongoose"),
bodyParser     =    require("body-parser"),
passport       =    require("passport"),
localStrategy  =    require("passport-local"),
flash       =        require("connect-flash"),
methodOverride =    require("method-override");
var path = require("path");
var moment = require('moment');                      
app            =    express();
app.use(flash());
app.set("view engine","ejs");
app.use(methodOverride ("_method"));
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));

/////including other modules////

var Gallery    =   require("./models/gallery");
var Comment       =   require("./models/comment");
var User          =   require("./models/user");


/////requiring routes/////


 var  commentRoutes     =  require("./routes/comments");
 var  galleryRoutes  =  require("./routes/gallery");
 var  indexRoutes       =  require("./routes/index");




//////MONGOOSE setup//////
  var mongoURI   =   'mongodb+srv://mayank:mass@cluster0-4ojfu.mongodb.net/test?retryWrites=true&w=majority';

mongoose.connect(mongoURI,{
    useNewUrlParser: true, 
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
});


/////passport configuration/////

app.use(require("express-session")({

  secret          : "Hello World",
  resave          :  false,
  saveUninitialized :  false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


///seeding the database for test purposes////
// seedDB();

 
 ///middleware to inform other routes about current user logged in/////

app.use(function(req,res,next){

   res.locals.currentUser = req.user;
   res.locals.error       =req.flash("error");

   res.locals.success     =req.flash("success");
   res.locals.user          =   require("./models/user");

   app.locals.moment = require('moment');
   next();

});

/////including routes/////


app.use("/",indexRoutes);
app.use("/gallery",galleryRoutes);
app.use("/gallery/:id/comments/",commentRoutes);



// connecting on port 2900
app.listen(process.env.PORT || 2900,function(){

    console.log("server has started");

});






      







      






