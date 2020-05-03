var mongoose             =   require('mongoose'),
passportLocalMongoose    =   require('passport-local-mongoose'),

///// creating a user schema
userSchema               =   new mongoose.Schema({
 
 username : String,
 password : String,
 image   : String,
 imageId: String,
 fullName : String,
 email: {type: String, unique: true, required: true},
    resetPasswordToken: String,
    resetPasswordExpires: Date,
 isAdmin  : {type : Boolean,default : false},
 joined: { type: Date, default: Date.now }


});


userSchema.plugin(passportLocalMongoose);

module.exports          =    mongoose.model("User",userSchema);