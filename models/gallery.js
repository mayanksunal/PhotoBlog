var mongoose =  require('mongoose');

/////Schema for gallerys/////

var gallerySchema  =   new mongoose.Schema
  ({
    name         : String,
    image        : String,
    imageId      : String,
    description  : String,
    author       : {

      id         : {

        type      : mongoose.Schema.Types.ObjectId,
        ref       :  "User",
      },
        username   :  String,
    },
    comments     :
    [{
      type       : mongoose.Schema.Types.ObjectId,
      ref        : "Comment",

    }],
    tags: [],
    createdAt: { type: Date, default: Date.now },
    rateAvg: Number,
    rateCount: Number,
    hasRated: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ]
  

  });
  

/////model for gallery/////

module.exports   =   mongoose.model("Gallery",gallerySchema);