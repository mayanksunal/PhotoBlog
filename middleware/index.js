var Gallery = require("../models/gallery");
var Comment = require("../models/comment");
var User = require("../models/user");


var middlewareObj  =  {};

/////middleware for logging in///

middlewareObj.isLoggedIn = function(req,res,next){

    if(req.isAuthenticated()){

        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
 };

/////middleware for GalleryOwnership ///


middlewareObj.checkGalleryOwnership = function(req,res,next)
{
   if(req.isAuthenticated()){
       Gallery.findById(req.params.id,function(err,foundGallery)
       {
           if(err)
           {
            req.flash("error", "Image not found");
            res.redirect("back");
           }
           else
           {
               if(foundGallery.author.id.equals(req.user._id)|| req.user.isAdmin)
               {
                   next();
               }
               else
               {

                req.flash("error", "You don't have permission to do that");
                res.redirect("back");
               }
           }
       });
   }
   else
   {
    req.flash("error", "You need to be logged in to do that");
    res.redirect("back");

   }
};

///middleware for userProfileOwnership
middlewareObj.checkProfileOwnership = function(req, res, next) {
  User.findById(req.params.user_id, function(err, foundUser) {
    if (err || !foundUser) {
      req.flash("error", "Sorry, that user doesn't exist");
      res.redirect("/gallery");
    } else if (foundUser._id.equals(req.user._id) || req.user.isAdmin) {
      req.user = foundUser;
      next();
    } else {
      req.flash("error", "You don't have permission to do that!");
      res.redirect("/gallery/" + req.params.user_id);
    }
  });
};

/////middleware for commentOwnership ///


middlewareObj.checkCommentOwnership =  function checkCommentOwnership(req,res,next)
{
    if(req.isAuthenticated())
    {
      Comment.findById(req.params.comment_id,function(err,foundComment)
      {
          if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin)
          {
              next();
          }
          else
          {
            req.flash("error", "You don't have permission to do that");
            res.redirect("back");
          }
      });
    }
    else
    {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};


module.exports = middlewareObj;