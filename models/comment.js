var mongoose      = require('mongoose');

/////Schema for campgrounds/////

var commentSchema  =   new mongoose.Schema
 ({
    text   : String,
    author : {
       
      id   : {

      type:mongoose.Schema.Types.ObjectId,
      ref  :"User",

      },
      username : String


    },
    rating : Number

 });

/////model for campground/////

module.exports   =   mongoose.model("Comment",commentSchema);