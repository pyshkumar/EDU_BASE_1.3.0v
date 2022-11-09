require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const homeStartingContent = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum";

const aboutContent = "Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of de Finibus Bonorum et Malorum (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, Lorem ipsum dolor sit ame, comes from a line in section 1.10.32. "

const contactContent = "Phone Number: 918098776";

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret:"myexisbitch",
  resave:false,
  saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://Piyush:Kpiyush113@cluster0.uleuvk4.mongodb.net/blogDB");

//************************************************** SCHEMA'S***************************//

//question/answer schema
// const questionSchema = new mongoose.Schema({
//   question:String,
//   author:String,
//   answer:{
//
//    giver:String,
//    ans:String
//
//   }[]
// });

const userSchema=new mongoose.Schema({
  name:String,
  phone_nr:Number,
  email:String,
  password:String,
  occupation:String,
  googleId:{ type: String, default: 'NULL' }
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User",userSchema);

// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

const blogSchema = new mongoose.Schema({
  title:{
    type:String,
    unique:true,
    required: true
  },
  content:String
});

const Blog = mongoose.model("Blog",blogSchema);



//*****************************OLD REGISTER PAGE************************//
// app.post("/register",function(req,res){
//
//   const hash = bcrypt.hashSync(req.body.password, saltRounds);
//
//   const newUser= new User({
//     email:req.body.username,
//     password:hash
//   });
//
//
//   newUser.save(function(err){
//     if(err){
//       console.log(err);
//     }
//     else
//     {
//       res.redirect("/front");//to the home page
//     }
//   })
// })
// ---=====================

app.post("/register",function(req,res){

User.register({username:req.body.username}, req.body.password, function(err, user){

  if(err)
  {
    console.log(err);
    res.redirect("/register");
  }
  else
  {
    passport.authenticate("local")(req,res, function()
    {
      res.redirect("/front");

    });
  }

});


});



app.get("/profile", function(req, res){
  if(req.isAuthenticated())
  {
    res.render("profile");
  }
  else
  {
    res.redirect("/login");
  }


});

app.get("/register", function(req, res){

  res.render("register");
});


//**********************************LOGIN PAGE*********************//
app.get("/login", function(req, res){
  res.render("login");
});


app.post("/login",function(req,res){

  const user = new User({
    username:req.body.username,
    password:req.body.password
  });


req.login(user,function(err){
  if(err)
  {
    res.redirect("/register");
  }
  else
  {
    passport.authenticate("local")(req,res,function(){
      res.redirect("/front");
    });


  }
})
  // User.findOne({email:username},function(err,foundUser){
  //   if(err)
  //   {
  //     console.log(err)
  //   }
  //   else
  //   {
  //     if(foundUser)
  //      {
  //        if(bcrypt.compareSync(password,foundUser.password))
  //        {
  //          res.redirect("/front");
  //        }
  //        else
  //        {
  //          res.redirect("/")
  //        }
  //      }
  //      else
  //      {
  //        res.redirect("/register")
  //      }
  //   }
  // })
});

app.get("/", function(req, res){

  res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/front");
  });

//*********************************HOME PAGE*******************************//
app.get("/front", function(req, res){

  if(req.isAuthenticated()){

    Blog.find(function(err,blogItems){
    if(!err)
    {

          res.render("front", {
          startingContent: homeStartingContent,
          posts:blogItems
          });

    }
    else{
      console.log(err);
        }

  });

  }
  else
  {
    res.redirect("/login");
  }


});

app.get("/logout", function(req, res, next) {
  req.logout(function(err) {
    if (err) {
      return next(err);
      }
    res.redirect("/");
  });
});


app.get("/about", function(req, res){
  if(req.isAuthenticated())
  {
    res.render("about", {aboutContent: aboutContent});
  }
  else
  {
    res.redirect("/login");
  }


});

app.get("/contact", function(req, res){
  if(req.isAuthenticated())
  {
    res.render("contact", {contactContent: contactContent});
  }
  else
  {
    res.redirect("/login");
  }


});


app.get("/Qcompose", function(req, res){
  res.render("Qcompose");
});


app.post("/Qcompose", function(req, res){

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


//**************************USING EJS FOR DISPLAYING Q&A discretelty************************//
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
