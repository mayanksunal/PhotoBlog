var  express     = require("express");
     router      = express.Router({mergeParams:true});
     Gallery  = require("../models/gallery");
     Comment     = require("../models/comment");
     middleware  = require("../middleware");






//adding new comments to our gallery//
router.get("/new",middleware.isLoggedIn,function(req,res){

    Gallery.findById(req.params.id,function(err,gallery){
      
      if(err)
      {
          console.log(err);
      }
      else
      {
          res.render("comments/new",{gallery:gallery});
      }
  
    });
  
  
  });
  
  
  
  
  
  //post method for submitting comment//
  router.post("/",middleware.isLoggedIn,function(req,res){
  
  
      Gallery.findById(req.params.id,function(err,gallery){
      
          if(err)
          {
              console.log(err);
              res.redirect("/gallery");
          }
          else
          {
              Comment.create(req.body.comment,function(err,comment){
                
                if(err)
                {
                    console.log(err);
                }
                else
                {
                    comment.author.id         =  req.user._id;
                    comment.author.username   =  req.user.username;
                    comment.save();
                    gallery.comments.push(comment);
                    gallery.save();
                    res.redirect("/gallery/"+ gallery._id);
                }
  
  
              });
          }
      
        });
      });


      /////editing a comment route/////

      router.get("/:comment_id/edit",middleware.checkCommentOwnership,function(req,res)
      {
        Comment.findById(req.params.comment_id,function(err,foundComment)
        {                  
            res.render("comments/edit",{gallery_id:req.params.id , comment : foundComment});
           
        });
      });



      /////updating a comment route/////

      router.put("/:comment_id",middleware.checkCommentOwnership,function(req,res)
      {
         Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,function(err,updatedComment)
         {

            if(err)
            {

                res.redirect("back");
            }
            else
            {
                res.redirect("/gallery/"+ req.params.id);
            }
         });
          

      });

      /////deleting a comment////

      router.delete("/:comment_id",middleware.checkCommentOwnership,function(req,res)
      {
          Comment.findByIdAndRemove(req.params.comment_id,function(err)
          {
             if(err)
             {
                 res.redirect("back");
             }
             else
             {
                 res.redirect("/gallery/"+req.params.id);
             }
          });
      });

      
     module.exports  =  router;
