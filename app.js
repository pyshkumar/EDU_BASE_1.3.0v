
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const encrypt =require("mongoose-encryption");

const homeStartingContent = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum";

const aboutContent = "Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of de Finibus Bonorum et Malorum (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, Lorem ipsum dolor sit ame, comes from a line in section 1.10.32. "



const contactContent = "Phone Number: 918098776";

const app = express();
console.log(process.env.API_KEY);
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://Piyush:Kpiyush113@cluster0.uleuvk4.mongodb.net/blogDB");



const userSchema=new mongoose.Schema({
  email:String,
  password:String
});


userSchema.plugin(encrypt,{secret:process.env.SECRET, encryptedFields:["password"] });

const User = mongoose.model("User",userSchema);

const blogSchema = new mongoose.Schema({
  title:{
    type:String,
    unique:true,
    required: true
  },
  content:String
});

const Blog = mongoose.model("Blog",blogSchema);

app.post("/register",function(req,res){
  const newUser= new User({
    email:req.body.username,
    password:req.body.password
  });


  newUser.save(function(err){
    if(err){
      console.log(err);
    }
    else
    {
      res.redirect("/front");//to the home page
    }
  })
})

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/login", function(req, res){
  res.render("login");
});


app.post("login",function(req,res){
  const username=req.body.username;
  const password=req.body.password;

  User.findOne({email:username},function(err,foundUser){
    if(err)
    {
      console.log(err)
    }
    else
    {
      if(foundUser)
       {
         if(foundUser.password==password)
         {
           res.redirect("/front");
         }
       }
    }
  })
})
// HOME GET
app.get("/", function(req, res){
  res.render("home");
});


//previosly home
app.get("/front", function(req, res){

  Blog.find(function(err,blogItems){
  if(!err){

      res.render("front", {
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

  res.redirect("/front");

});


//DISPLAYING Q&A discretelty
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

//PORT USED AS SERVER
// const port = process.env.PORT || 3000;
app.listen(3000, function() {
  console.log("Server running at port 3000");
});
