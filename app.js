
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session=require('express-session');
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const app = express();
const findOrCreate = require('mongoose-findorcreate');

app.use(express.static("public"));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
  secret: "new secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());




mongoose.connect("mongodb://localhost:27017/minor", {useNewUrlParser: true});

var db=mongoose.connection;
db.on('error', console.log.bind(console, "connection error"));
db.once('open', function(callback){
    console.log("connection succeeded");
});







const homeStartingContent = "To-do lists are essential if you're going to beat work overload. When you don't use them effectively, you'll appear unfocused and unreliable to the people around you.";

const aboutContent = "The Key to Efficiency Do you often feel overwhelmed by the amount of work you have to do? Do you find yourself missing deadlines? Or do you sometimes just forget to do something important, so that people have to chase you to get work "





    


const contactContent = "Phone Number: 918098776";








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
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});










const blogSchema = new mongoose.Schema({
  title:{
    type:String,
    unique:true,
    required: true
  },
  content:String
});

const Blog = mongoose.model("Blog",blogSchema);



app.post("/register", function(req, res){

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.send("register succesful");
      });
    }
  });

});





app.get("/register", function(req, res){
  res.render("register");
});

app.get("/login", function(req, res){
  res.render("login");
});



app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });

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




//PORT USED AS SERVER
// const port = process.env.PORT || 3000;
app.listen(3000, function() {
  console.log("Server running at port 3000");
});
