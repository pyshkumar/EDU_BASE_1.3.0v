
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");


const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/minor")
var db=mongoose.connection;
db.on('error', console.log.bind(console, "connection error"));
db.once('open', function(callback){
    console.log("connection succeeded");
})

    


const contactContent = "Phone Number: 918098776";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));






//question/answer schema
const questionSchema = new mongoose.Schema({
  question:String,
  author:String,
  answer:{

   giver:String,
   ans:String

  }
});
const Ques=mongoose.model("Ques",questionSchema);

const userSchema=new mongoose.Schema({
 
  email:String,
  password:String
});


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

  var mail =req.body.email;
  var pass = req.body.password;
  
  

  var data = {
    email:req.body.username,
    password:req.body.password
      
  }
db.collection('users').insertOne(data,function(err, collection){
      if (err) throw err;
      console.log("Record inserted Successfully");
            res.render("login");
  });  
});






app.get("/register", function(req, res){
  res.render("register");
});

app.get("/login", function(req, res){
  res.render("login");
});


app.post("/login",function(req,res){
  const Username=req.body.username;
  const Password=req.body.password;


  var req_userData=User.findOne({email: Username});

console.log("fetched data is"+req_userData._id);

    if(req_userData.password==Password)
    {
      res.send("login succesful");

        //res.redirect("");                 //takes to welcome page
    }
    else{
        res.send("either of the entries are incorrect try again,else if new user hit the signup button");
        
                    
    }
    
    });
    
    
    
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
