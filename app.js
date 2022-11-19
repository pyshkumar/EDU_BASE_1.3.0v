require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const homeStartingContent = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum";

const aboutContent = "Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of de Finibus Bonorum et Malorum (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, Lorem ipsum dolor sit ame, comes from a line in section 1.10.32. "

const contactContent = "Phone Number: 918098776";

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.use(session({
  secret: "myexisbitch",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/blogdb1",{useNewUrlParser:true});
const categoryschema={
  title:String
};
const Category = mongoose.model('Category',categoryschema);
const noteschema={
  title:String,
  description:String,
category :{
      type:mongoose.Schema.Types.ObjectId,
      ref:'Category'
  }
}

const Note=mongoose.model("Note",noteschema);
app.get("/notes",function(req,res)
{
  Note.find({}).populate('category').exec(function(err,notes)
{
    res.render("notes",{notes:notes});
})
})
app.get("/newnote",function(req,res)
{
  Category.find({},function(err,c)
  {
    if (c) {console.log("Present categories", c);} else {console.log("Not present");}
  for(var i=0;i<c.length;i++){
   console.log(c[i])
   }
    res.render("newnote",{categories:c});
  }
)
})
app.post("/notes",function (req,res)
{
  console.log("this is catoegory fetching  : ",req.body.category_id);

  const note=new Note({
    title:req.body.title,
    description:req.body.description,
    category:req.body.category_id
  })
  note.save(function(err)
{
  if(!err)
  {
    res.redirect("/notes");
  }
})
})
const person = {
  email: "NULL",
  googleId: "NULL",
  id: "NULL"
};

const ques = {
  id: "NULL"
};

//************************************************** SCHEMA'S***************************//
const postSchema = {
  title: String,
  username: String,
  content: String,
  doc: {
    type: Date,
    default: Date.now
  }
};

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    unique: true,
    required: true
  },
  content: String,
  doc: {
    type: Date,
    default: Date.now
  }
});



const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    default: 'NULL'
  },
  ask_id: {
    type: String,
    default: 'NULL'
  },
  doc: {
    type: Date,
    default: Date.now
  }
});


const answerSchema = new mongoose.Schema({
  answer: {
    type: String,
    default: 'NULL'
  },
  question_id: {
    type: String,
    default: 'NULL'
  },
  answerer_id: {
    type: String,
    default: 'NULL'
  },
  doc: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  fname: {
    type: String,
    default: 'NULL'
  },
  lname: {
    type: String,
    default: 'NULL'
  },
  phone_nr: {
    type: String,
    default: 'NULL'
  },
  email: {
    type: String,
    unique: true,
    default: 'NULL'
  },
  username: {
    type: String,
    default: 'NULL'
  },
  password: {
    type: String,
    default: 'NULL'
  },
  occupation: {
    type: String,
    default: 'NULL'
  },
  address: {
    type: String,
    default: 'NULL'
  },
  googleId: {
    type: String,
    default: 'NULL'
  },
  doj: {
    type: Date,
    default: Date.now
  }
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);
const Answer = mongoose.model("Answer", answerSchema);
const Question = mongoose.model("Question", questionSchema);
const Post = mongoose.model("POST", postSchema);
const Blog = mongoose.model("Blog", blogSchema);

passport.use(User.createStrategy());


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
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    person.googleId = profile.id;
    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

////////////////////////////////////////////Routing//////////////////////////

//////////////////////////////////PROFILE///////////////////////////////////

app.get("/profile", function(req, res) {

  if (req.isAuthenticated()) {
    User.findOne({
      _id: person.id
    }, (err, data) => {
      if (err) {
        console.log(err);
      } else {
        res.render("profile", {
          fname: data.fname,
          lname: data.lname,
          phone_nr: data.phone_nr,
          email: data.email,
          occupation: data.occupation,
          address: data.address
        });
      }

    });
  } else {
    res.redirect("/");
  }


});

app.get("/edit", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("edit");
  } else {
    res.redirect("/profile");
  }
});

app.post("/edit", function(req, res) {


  User.findOneAndUpdate({
      _id: person.id
    }, {
      fname: req.body.fname,
      lname: req.body.lname,
      phone_nr: req.body.phone_nr,
      email: req.body.email,
      occupation: req.body.occupation,
      address: req.body.address
    },
    null,
    function(err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/profile")
      }

    });


});


/////////////////////////////////////REGISTERATION PAGE////////////////////////////////////////////
app.get("/register", function(req, res) {

  res.render("register");
});

app.post("/register", function(req, res) {

  person.email = req.body.username;

  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {

    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {



      passport.authenticate("local")(req, res, function() {

        User.findOne({
          username: person.email
        }, (err, data) => {
          if (err) {
            console.log(err);
          } else {
            person.id = data._id
          }

        });

        res.redirect("/front");

      });
    }

  });


});


//**********************************LOGIN PAGE*********************//
app.get("/login", function(req, res) {
  res.render("login");
});


app.post("/login", function(req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });


  req.login(user, function(err) {
    if (err) {
      res.redirect("/");
    } else {
      person.email = req.body.username;
      User.findOne({
        username: req.body.username
      }, (err, data) => {
        if (err) {
          console.log(err);
        } else {
          person.id = data._id
        }

      });

      passport.authenticate("local")(req, res, function() {
        res.redirect("/front");
      });


    }
  })

});

app.get("/", function(req, res) {
  person.email = 'NULL';
  person.googleId = 'NULL'; //initializing 'person' named, js object members with NULL value.
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", {
    scope: ["profile"]
  })
);

app.get("/auth/google/secrets",
  passport.authenticate("google", {
    failureRedirect: "/"
  }),
  function(req, res) {
    res.redirect("/front");
  });

app.get("/logout", function(req, res, next) {
  req.logout(function(err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});


//*********************************First page after logging*******************************//
app.get("/front", function(req, res) {

  if (req.isAuthenticated()) {

    Blog.find(function(err, blogItems) {
      if (!err) {

        res.render("front", {
          startingContent: homeStartingContent,
          posts: blogItems
        });

      } else {
        console.log(err);
      }

    });

  } else {
    res.redirect("/");
  }


});


app.get("/about", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("about", {
      aboutContent: aboutContent
    });
  } else {
    res.redirect("/");
  }


});

app.get("/contact", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("contact", {
      contactContent: contactContent
    });
  } else {
    res.redirect("/");
  }


});

////////////////////////////////////////////////BLOG/////////////////////////////////////////

app.get("/compose", function(req, res) {
  res.render("compose");
});

app.post("/compose", function(req, res) {
  const post = new Post({
    title: req.body.posttitle,
    username: person.email,
    content: req.body.postcom,
  });
  post.save(function(err) {
    if (!err) {
      res.redirect("/blog");
    }
  });
});

app.get("/blog", function(req, res) {
  Post.find({}, function(err, posts) {
    res.render("blog", {
      post: posts
    });
  })
});

app.get("/posts/:title", function(req, res) {
  const requestedPosttitle = req.params.title;
  //console.log("this is requested post id"+ requestedPosttitle);
  Post.findOne({
    title: requestedPosttitle
  }, function(err, post) {
    res.render("post", {
      title: post.title,
      username: post.username,
      content: post.content,
      doc: post.doc
    });
  });
});


//////////////////////////////////////////QUESTION & ANSWER////////////////////////////////
app.get("/question", function(req, res) {

  if (req.isAuthenticated()) {
    Question.find(function(err, questionItems) {
      if (!err) {

        res.render("question", {
          questions: questionItems
        });

      } else {
        console.log(err);
      }

    });
  } else {
    res.redirect("/");
  }


});

app.get("/ask_q", function(req, res) {
  res.render("ask_q");
});


app.post("/ask_q", function(req, res) {

  const newquestion = new Question({
    question: req.body.question,
    ask_id: person.id
  });

  newquestion.save(function(err) {
    if (err) {
      console.log(err);
    }
  });


  res.redirect("/question");

});


app.get("/answer", function(req, res) {
  res.render("answer");
});


app.post("/answer", function(req, res) {

  const newanswer = new Answer({
    answer: req.body.answer,
    answerer_id: person.id,
    question_id: ques.id
  });

  newanswer.save(function(err) {
    if (err) {
      console.log(err);
    }
  });


  res.redirect("/question"); //try to redirect to question via pp.get("/questions/:ques.id", function(req, res) {

});

app.get("/questions/:questionid", function(req, res) {

  if (req.isAuthenticated()) {

    const requestedTitle = req.params.questionid;

    Question.findOne({
      _id: requestedTitle
    }, function(err, questionItem) {

      if (!err) {

        if (questionItem) {
          ques.id = requestedTitle;
          Answer.find({
            question_id: requestedTitle
          }, function(err, answerItems) {
            if (!err) {

              res.render("Qns", {
                question: questionItem.question,
                answers: answerItems
              });


            } else {
              console.log(err);
            }

          });


        } else {
          console.log("NOT FOUND");
        }
      } else {
        console.log(err);
      }
    });

  } else {
    res.redirect("/question");
  }

});


//PORT USED AS SERVER
// const port = process.env.PORT || 3000;
app.listen(3000, function() {
  console.log("Server running at port 3000");
});
