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
const upload = require("./services/fileupload");
const nodemailer = require('nodemailer')

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
// app.use(upload.any())
app.use(express.static("public"));

app.use(session({
  secret: "mynameiszeusZ  ", //changed
  resave: false,
  saveUninitialized: false,
  cookie: {
    _expires: (60 * 60 * 1000)
  }
}));

app.use(passport.initialize());
app.use(passport.session());
const cors = require("cors");
app.use(cors());

mongoose.connect("mongodb+srv://" + process.env.API_KEY + ".mongodb.net/eduBase");
// mongoose.connect("mongodb://localhost:27017/blogdb2",{useNewUrlParser:true});


var genOtp = " "

const person = {
  email: "NULL",
  googleId: "NULL",
  id: "NULL"
};

const ques = {
  id: "NULL"
};

//************************************************** SCHEMA'S***************************//
const noteschema = {
  title: String,
  description: String,
  fileUrl: String,
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }
}


const categoryschema = {
  title: String
};


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
  },
  admin: {
    type: Boolean,
    default: false
  }
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);
const Answer = mongoose.model("Answer", answerSchema);
const Question = mongoose.model("Question", questionSchema);
const Post = mongoose.model("POST", postSchema);
const Blog = mongoose.model("Blog", blogSchema);
const Category = mongoose.model('Category', categoryschema);
const Note = mongoose.model("Note", noteschema);

passport.use(User.createStrategy());


passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture,
      admin: user.admin
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



        var otp = generateOTP();
        genOtp = otp.toString();
        var msg_text = 'Hi user!\nYour otp to access EDU_BASE  is ' + otp + '\n\nThis OTP is confidential,please do not share it with any one else.\n\n\n\nRegards,Team EDU_BASE.'

        var mailOptions = {
          from: 'edubasejiit@gmail.com',
          to: req.body.username,
          subject: 'OTP for authourizing mail at EDU_BASE!!!',
          text: msg_text
        };
        smptTransport.sendMail(mailOptions, function(error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent :' + info.response);


          }
        })



        User.findOneAndUpdate({
            username: req.body.username
          }, {
            fname: " ",
            lname: " ",
            phone_nr: " ",
            email: req.body.username,
            occupation: " ",
            address: " "
          },
          null,
          function(err) {
            if (err) {
              console.log(err);
            } else {
              console.log('registration completed')
            }

          });

        res.redirect("/otp");

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


  var otp = generateOTP();
  genOtp = otp.toString();
  var msg_text = 'Hi user!\nYour otp to access EDU_BASE  is ' + otp + '\n\nThis OTP is confidential,please do not share it with any one else.\n\n\n\nRegards,Team EDU_BASE.'

  var mailOptions = {
    from: 'edubasejiit@gmail.com',
    to: req.body.username,
    subject: 'OTP for authourizing mail at EDU_BASE!!!',
    text: msg_text
  };
  smptTransport.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent :' + info.response);

    }
  })
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
        res.redirect("/otp");
      });

    }
  })

});
///////////////////////////////////OTP//////////////////////////////////////

function generateOTP() {
  var digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < 4; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}


const smptTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'edubasejiit@gmail.com',
    pass: 'kegrcktkasiwdjgx'
  }
});


app.get("/otp", function(req, res) {
  res.render("otp");
});
app.post("/otp", function(req, res) {
  if (req.body.otp == genOtp) {
    res.redirect("/front");
  } else {
    res.send("incorrect otp")
    req.logout(function(err) {
      if (err) {
        return next(err);
      }

    });
  }
})

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

        res.render("front");

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
    res.render("about");
  } else {
    res.redirect("/");
  }


});

app.get("/contact", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("contact");
  } else {
    res.redirect("/");
  }


});

////////////////////////////////////////////////BLOG/////////////////////////////////////////

app.get("/compose", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("compose");
  } else {
    res.redirect("/");
  }

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
  if (req.isAuthenticated()) {

    Post.find({}, function(err, posts) {
      res.render("blog", {
        post: posts
      });
    })
  } else {
    res.redirect("/");
  }

});

app.get("/posts/:title", function(req, res) {

  if (req.isAuthenticated()) {

    const requestedPosttitle = req.params.title;
    //console.log("this is requested post id"+ requestedPosttitle);
    Post.findOne({
      title: requestedPosttitle
    }, function(err, post) {
      db.User.aggregate(
        [{
          $project: {
            yearMonthDayUTC: {
              $dateToString: {
                format: "%Y-%m-%d",
                doj: "$date"
              }
            },

          }
        }]
      )
      res.render("post", {
        title: post.title,
        username: post.username,
        content: post.content,
        doc: post.doc
      });
    });

  } else {
    res.redirect("/");
  }

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

  if (req.isAuthenticated()) {
    res.render("ask_q");

  } else {
    res.redirect("/");
  }

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
  if (req.isAuthenticated()) {
    res.render("answer");
  } else {
    res.redirect("/");
  }

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


  res.redirect("/question");

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
/////////////////////////////////////study material////////////////////////////

app.get("/notes", function(req, res) {
  if (req.isAuthenticated()) {

    Note.find({}).populate('category').exec(function(err, notes) {
      res.render("notes", {
        notes: notes,
        user: req.user
      });
    })

  } else {
    res.redirect("/");
  }

})
app.get("/newnote", function(req, res) {
  if (req.isAuthenticated() && req.user && req.user.admin) {

    Category.find({}, function(err, c) {
      res.render("newnote", {
        categories: c
      });
    })

  } else {
    res.redirect("/notes");
  }

})
app.post("/notes", upload.single("file"), function(req, res) {

  const note = new Note({
    title: req.body.title,
    description: req.body.description,
    category: req.body.category_id,
    fileUrl: req.file.location
  })
  note.save(function(err) {
    if (!err) {
      res.redirect("/notes");
    }
  });

})

//PORT USED AS SERVER
// const port = process.env.PORT || 3000;
app.listen(3000, function() {
  console.log("Server running at port 3000");
});
