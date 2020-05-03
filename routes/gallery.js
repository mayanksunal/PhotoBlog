var  express     = require("express");
     router      = express.Router();
     Gallery  = require("../models/gallery");
     middleware  = require("../middleware");
     var multer = require('multer');
     var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'dr81np8zr', 
  api_key: process.env.API_KEY, 
  api_secret: process.env.API_SECRET
});
     


//NEW - show form to create new gallery
router.get("/new",middleware.isLoggedIn, function(req, res){
    res.render("gallery/new"); 
 });

 
 

router.post("/", middleware.isLoggedIn, upload.single('image'), async function(req, res) {
    cloudinary.v2.uploader.upload(req.file.path, async function(err, result) {
      if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      // add cloudinary url for the image to the gallery object under image property
      req.body.gallery.image = result.secure_url;
      // add image's public_id to gallery object
      req.body.gallery.imageId = result.public_id;
      // add author to gallery
      req.body.gallery.author = {
        id: req.user._id,
        username: req.user.username
      }
      Gallery.create(req.body.gallery, function(err, gallery) {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        res.redirect('/gallery/' + gallery.id);
      });
     
  
    });
});


//INDEX - show all gallery
router.get("/", function(req, res){
  var noMatch = null;
  if(req.query.search) {
      const regex = new RegExp(escapeRegex(req.query.search), 'gi');
      // Get all gallery from DB
      Gallery.find({name: regex}, function(err, allGallery){
         if(err){
             console.log(err);
         } else {
            if(allGallery.length < 1) {
                noMatch = "No gallery match that query, please try again.";
            }
            res.render("gallery/index",{gallery:allGallery, noMatch: noMatch});
         }
      });
  } else {
      // Get all gallery from DB
      Gallery.find({}, function(err, allGallery){
         if(err){
             console.log(err);
         } else {
            res.render("gallery/index",{gallery:allGallery,currentUser:req.user, noMatch: noMatch});
         }
      });
  }
});


// SHOW - shows more information about one gallery
router.get("/:id", function(req, res) {
  Gallery.findById(req.params.id)
    .populate("comments")
    .exec(function(err, foundGallery) {
      if (err || !foundGallery) {
        console.log(err);
        req.flash("error", "Sorry, that gallery does not exist!");
        return res.render("error");
      }
      var ratingsArray = [];

      foundGallery.comments.forEach(function(rating) {
        ratingsArray.push(rating.rating);
      });
      if (ratingsArray.length === 0) {
        foundGallery.rateAvg = 0;
      } else {
        var ratings = ratingsArray.reduce(function(total, rating) {
          return total + rating;
        });
        foundGallery.rateAvg = ratings / foundGallery.comments.length;
        foundGallery.rateCount = foundGallery.comments.length;
      }
      foundGallery.save();
      res.render("gallery/show", {
        gallery: foundGallery
      });
    });
});

/////editing a gallery/////
router.get("/:id/edit",middleware.checkGalleryOwnership,function(req,res){
    //finding a gallery with specefic id///
    Gallery.findById(req.params.id,function(err,foundGallery){
            res.render("gallery/edit",{gallery:foundGallery});
        
    });
 
});



/////updating a gallery (use of put)/////

router.put("/:id",middleware.checkGalleryOwnership,upload.single('image'),function(req,res){
   //finding a gallery by id and updating it
   Gallery.findById(req.params.id, async function(err, gallery){
    if(err){
        req.flash("error", err.message);
        res.redirect("back");
    } else {
        if (req.file) {
          try {
              await cloudinary.v2.uploader.destroy(gallery.imageId);
              var result = await cloudinary.v2.uploader.upload(req.file.path);
              gallery.imageId = result.public_id;
              gallery.image = result.secure_url;
          } catch(err) {
              req.flash("error", err.message);
              return res.redirect("back");
          }
        }
        gallery.name = req.body.name;
        gallery.description = req.body.description;
        gallery.save();
        req.flash("success","Successfully Updated!");
        res.redirect("/gallery/" + gallery._id);
    }
});
   
});


router.delete('/:id',middleware.checkGalleryOwnership, function(req, res) {
    Gallery.findById(req.params.id, async function(err, gallery) {
      if(err) {
        req.flash("error", err.message);
        return res.redirect("back");
      }
      try {
          await cloudinary.v2.uploader.destroy(gallery.imageId);
          gallery.remove();
          req.flash('success', 'Gallery deleted successfully!');
          res.redirect('/gallery');
      } catch(err) {
          if(err) {
            req.flash("error", err.message);
            return res.redirect("back");
          }
      }
    });
  });

  function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports  =  router;