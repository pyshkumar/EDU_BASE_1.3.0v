

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");

const homeStartingContent = "To-do lists are essential if you're going to beat work overload. When you don't use them effectively, you'll appear unfocused and unreliable to the people around you.";

const aboutContent = "The Key to Efficiency Do you often feel overwhelmed by the amount of work you have to do? Do you find yourself missing deadlines? Or do you sometimes just forget to do something important, so that people have to chase you to get work "

const contactContent = "Have a difficulty ? We will get to. Kindly drop your credentails for the same.";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://Piyush:g3H0f79PdTnlHRg4@cluster0.uleuvk4.mongodb.net/ blogDB");

const blogSchema = new mongoose.Schema({
  title:{
    type:String,
    unique:true,
    required: true
  },
  content:String
});

const Blog = mongoose.model("Blog",blogSchema);


app.get("/", function(req, res){

  Blog.find(function(err,blogItems){
  if(!err){

      res.render("home", {
        startingContent: homeStartingContent,
        posts:blogItems
        });

  }
  else{
    console.log(err);
      }

});
});

app.get("/about", function(req, res){
  res.render("about", {aboutContent: aboutContent});
});

app.get("/contact", function(req, res){
  res.render("contact", {contactContent: contactContent});
});

app.get("/compose", function(req, res){
  res.render("compose");
});

app.post("/compose", function(req, res){

  const post = new Blog({
    title: _.capitalize(req.body.postTitle),
    content: req.body.postBody
  });

  post.save(function(err){
    if(err){
      console.log(err);
    }
  });

  res.redirect("/");

});

app.get("/posts/:postName", function(req, res){

  const requestedTitle = _.capitalize(req.params.postName);

   Blog.findOne({title:requestedTitle}, function(err,blogItem){

   if(!err){

    if(blogItem)
    {
      res.render("post", {title: blogItem.title, content: blogItem.content});
    }

   else{
         console.log("NOT FOUND");
       }
  }
  else{
    console.log(err);
  }
});

});

const port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Server running at port 3000");
});
