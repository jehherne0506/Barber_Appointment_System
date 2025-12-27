require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const passport = require("passport");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser"); 
const rateLimit = require("express-rate-limit");
const stripe = require('stripe')(process.env.STRIPE_API_KEY);
const http = require("http");
const crypto = require("crypto");
const { Server } = require("socket.io");

const User = require("./models/user");
const Service = require("./models/service");
const Appointment = require("./models/appointment");
const UnavailableTimeslot = require("./models/unavailableTimeslot");
const Feedback = require("./models/feedback");

const connectMongoose = require('./connectMongoose');
const generateCookie = require('./generateCookie');
const {sendVerificationEmail, sendMakeAppointmentDetails, sendRescheduleAppointmentDetails, sendDeleteAppointmentDetails, sendAppointmentInProgress, sendAppointmentCompleted, sendFeedback, sendVerifyEmailChange} = require('./sendEmail');
const {verifyUser, verifyStaff, verifyAdmin} = require('./auth');
const generateTimeslot = require('./generateTimeslot');
const stripePayment = require('./stripePayment');
const scheduleSMS = require('./scheduleSMS');
const connectRedisCache = require('./connectRedisCache');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    limit: 500,
    standardHeaders: true, 
    legacyHeaders: true, 
    ipv6Subnet: 56, 
});

let redisClient = connectRedisCache();
const CACHE_EXPIRATION = 3600;

const app = express();
app.set("view engine", "ejs");
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true
  }
});

io.on("connection", (socket)=>{
  console.log("a user connected");

  socket.on("join", function(room){
    socket.join(room);
    console.log("a user join " + room);
  });

  socket.on("newAppointment", function(appointmentData){
    socket.emit("newAppointment", appointmentData);
  });
  
  socket.on("appointmentInProgress", function(appointmentData){
    socket.to("customer").emit("appointmentInProgress", appointmentData);
  });

  socket.on("appointmentCompleted", function(appointmentData){
    socket.to("customer").emit("appointmentCompleted", appointmentData);
  });

  socket.on("rescheduleAppointment", function(appointmentData){
    socket.to("customer").emit("rescheduleAppointment", appointmentData);
  });

  socket.on("cancelAppointment", function(appointmentData){
    socket.to("customer").emit("cancelAppointment", appointmentData);
  });

  socket.on("disconnect", ()=>{
    console.log("a user disconnect");
  });
});

scheduleSMS();

app.post('/webhook', express.raw({type: 'application/json'}), async(request, response) => {
  let event;
  if (process.env.STRIPE_SIGNING_SECRET) {
    const signature = request.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        signature,
        process.env.STRIPE_SIGNING_SECRET
      );
    } catch (err) {
      console.log(`Webhook signature verification failed.`, err.message);
      return response.sendStatus(400);
    }

    try{
      if(event.type === "checkout.session.completed"){
        const eventData = event.data.object;
        const appointmentId = eventData.metadata.appointmentId;
        const appointment = await Appointment.findOne({
          _id: appointmentId
        }).populate("customerId", "username email").populate("serviceId", "name price").populate("staffId", "username email");
        const email = appointment.customerId.email;
        appointment.paymentStatus = "PAID";
        await appointment.save();

        io.emit("newAppointment", appointment);
        sendMakeAppointmentDetails(appointment, email);
      }
    } catch(err){
      console.log(err);
      return response.sendStatus(400);
    }

  response.json({received: true});
}});

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(limiter);

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/google/callback",
    passReqToCallback: true
  },
  async function(req, googleAccessToken, googleRefreshToken, profile, cb) {
    try{
      const email = profile.emails[0].value;

      if(!email){
        email = `${profile.id}@google.com.fake`
      }

      const userFound = await User.findOne({
        email: email
      });

      let user;
      if(userFound){
        if(!userFound.googleId){
          userFound.googleId = profile.id;
          await userFound.save();
        }
        user = userFound;
      } else{
        const newUser = new User({
          username: profile.displayName,
          email: email,
          avatar: profile.photos[0]?.value,
          googleId: profile.id,
        });
        await newUser.save();
        user = newUser;
      };
    
      const jwtAccessToken = jwt.sign({id: user.id, username: user.username, email: user.email, avatar: user.avatar, role: user.role}, process.env.JWT_SECRET, {expiresIn: '15m'});
      const jwtRefreshToken = jwt.sign({id: user.id, username: user.username, email: user.email, avatar: user.avatar, role: user.role}, process.env.JWT_SECRET, {expiresIn: '7d'});

      return cb(null, user, {jwtAccessToken, jwtRefreshToken});
    } catch(err){
        console.log(err);
        return cb(err, null);
    }
  }
)); 

app.get('/auth/google',
  passport.authenticate('google', { session: false, scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/auth/login', session: false }),
  function(req, res) {
    // Successful authentication, redirect home.
    const {jwtRefreshToken, jwtAccessToken} = req.authInfo; 
    generateCookie(res, jwtRefreshToken, jwtAccessToken); 
    if(req.user.role === "ADMIN"){
      return res.redirect("http://localhost:3000/admin");
    } else if(req.user.role === "STAFF"){
      return res.redirect("http://localhost:3000/staff");
    } else{
      return res.redirect("http://localhost:3000/");
    }
  });

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:5000/auth/facebook/callback",
  profileFields: ["id", "displayName", "emails", "photos"],
  passReqToCallback: true
},
async function(req, fbAccessToken, fbRefreshToken, profile, cb) {
 try{
    const email = profile.emails[0].value;

    if(!email){
      email = `${profile.id}@facebook.com.fake`
    }

    const userFound = await User.findOne({
      email: email
    });

    let user;
    if(userFound){
      if(!userFound.facebookId){
        userFound.facebookId = profile.id;
        await userFound.save();
      }
      user = userFound;
    } else{
      const newUser = new User({
        username: profile.displayName,
        email: email,
        avatar: profile.photos[0]?.value,
        facebookId: profile.id,
      });
      await newUser.save();
      user = newUser;
    };

      const jwtRefreshToken = jwt.sign({id: user.id, username: user.username, email: user.email, avatar: user.avatar, role: user.role}, process.env.JWT_SECRET, {expiresIn: '7d'});
      const jwtAccessToken = jwt.sign({id: user.id, username: user.username, email: user.email, avatar: user.avatar, role: user.role}, process.env.JWT_SECRET, {expiresIn: '15m'});

      return cb(null, user, {jwtRefreshToken, jwtAccessToken});
    } catch(err){
        console.log(err);
        return cb(err, null);
    }
}
));

app.get('/auth/facebook',
  passport.authenticate('facebook', {session: false, scope: ['email']}));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: 'http://localhost:3000/auth/login', session: false }),
  function(req, res) {
    // Successful authentication, redirect home.
    const {jwtRefreshToken, jwtAccessToken} = req.authInfo;
    generateCookie(res, jwtRefreshToken, jwtAccessToken);
    if(req.user.role === "ADMIN"){
      return res.redirect("http://localhost:3000/admin");
    } else if(req.user.role === "STAFF"){
      return res.redirect("http://localhost:3000/staff");
    } else{
      return res.redirect("http://localhost:3000/");
    }
  });

app.post('/auth/register', async(req, res)=>{
  const {username, email, password, phoneNumber} = req.body;

  if(username && email && password){
    // Check if email is used
    const email_exist = await User.findOne({
      email: email
    }); 

    if(email_exist){
      return res.json({"status": "fail", "message": "email"})
    } else  {
      // set schema default avatar as this link with cloudinary, so can rmv this line
      const avatar = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
      const hashPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        username: username,
        email: email,
        password: hashPassword,
        avatar: avatar,
        phoneNumber: phoneNumber
      });
      
      if(newUser){
        await newUser.save();
        const jwtAccessToken = jwt.sign({id: newUser.id,  username: newUser.username, email: newUser.email, avatar: newUser.avatar, role: "CUSTOMER"}, process.env.JWT_SECRET, {expiresIn: '1d'});

        const urlVerify = `http://localhost:5000/auth/verifyEmail?token=${jwtAccessToken}`;console.log("mail Status")
        const mailStatus = await sendVerificationEmail(email, urlVerify);console.log(mailStatus)
        if(mailStatus){
          return res.json({status: "success"});
        }
        return res.json({status: "fail", message: "error"});
      } 
      return res.json({status: "fail", message: "error"});
    }
  }
})

app.get('/auth/verifyEmail', async(req,res)=>{
  const token = req.query.token;
  jwt.verify(token, process.env.JWT_SECRET, async function(err, token_data){console.log(err);
    if(err){
      let decoded = jwt.decode(token_data);
      let emailFromToken = decoded?.email;
      if(emailFromToken){
        try{
          const user = await User.findOne({
            email: emailFromToken
          });

          if(user && !user.emailVerified){
            await user.deleteOne({email: emailFromToken});
            console.log("Unverified user deleted (invalid/expired token)");
          }
        } catch(err){
          console.log(err);
        }
      } else{
        console.log("Cannot decode token to extract email");
      }
      return res.redirect("http://localhost:3000/auth/verifyEmail/fail");
    } else{
      const email = token_data.email;
      try{
        const user = await User.findOne({
         email: email
        });

        if(user){
          user.emailVerified = true;
          await user.save();
          res.redirect("http://localhost:3000/auth/verifyEmail/success");
        }
      } catch(err){
        console.log(err);
        return res.redirect("http://localhost:3000/auth/verifyEmail/fail");
      }
    }
  })
});

app.get('/auth/verify', async(req,res)=>{
  try{console.log("verify")
    const accessTokenPass = req.cookies.accessToken;console.log(accessTokenPass)
    try{
      const decoded = jwt.verify(accessTokenPass, process.env.JWT_SECRET);console.log(decoded)
      return res.json({status: "success", message: decoded})
    } catch(err){
      console.log(err);

      if (err.name === "TokenExpiredError") {
        return res.json({status: "fail", message: "expired"});
      } else{
        return res.json({status: "fail", message: "error"});
      }
    }
  } catch(err){
    return res.json({status: "fail", message: "no token"});
  }
  });

app.post('/auth/refresh', async(req,res)=>{
  try{
    const token = req.cookies.refreshToken;

    if(!token){
      return res.json({status: "fail", message: "no refresh token"});
    }

    try{
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const newAccessToken = jwt.sign({id: decoded.id, username: decoded.username, email: decoded.email, avatar: decoded.avatar, role: decoded.role}, process.env.JWT_SECRET, {expiresIn: '15m'});
      const newRefreshToken = jwt.sign({id: decoded.id, username: decoded.username, email: decoded.email, avatar: decoded.avatar, role: decoded.role}, process.env.JWT_SECRET, {expiresIn: '7d'});

      generateCookie(res, newRefreshToken, newAccessToken);
console.log("refresh ok")
      return res.json({status: "success"});
    } catch(err){
      console.log(err);
      return res.json({status: "fail", message: "error"});
    }
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }
});

app.post('/auth/login', async(req,res)=>{
  const {email, password} = req.body;
  try{
    const user = await User.findOne({
      email: email
    }); console.log(user);

    if(user && user.emailVerified){console.log('verified email')
      const userPassword = user.password;
      const correctPassword = await bcrypt.compare(password, userPassword);
      if(correctPassword){console.log("correct password")
        const newAccessToken = jwt.sign({id: user.id, username: user.username, email: user.email, avatar: user.avatar, role: user.role}, process.env.JWT_SECRET, {expiresIn: '15m'});
        const newRefreshToken = jwt.sign({id: user.id, username: user.username, email: user.email, avatar: user.avatar, role: user.role}, process.env.JWT_SECRET, {expiresIn: '7d'});

        generateCookie(res, newRefreshToken, newAccessToken);
        console.log(newAccessToken);
        console.log("generated")
        return res.json({status: "success", role: user.role});
      }
      return res.json({status: "fail", message: "notMatch"});
    } else if(user && !user.emailVerified){
      return res.json({status: "fail", message: "emailNotVerified"});
    } else{
      return res.json({status: "fail", message: "notMatch"});
    }
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }
});

app.post('/feedback', verifyUser, async(req,res)=>{
  const {name, email, date, service, comment} = req.body;
  try{
    const customer = await User.findOne({email: email});
    const serviceId = await Service.findOne({name: service});
    if(serviceId){
      let newFeedback;
      if(customer){
        newFeedback = await Feedback({
          customerId: customer._id,
          date: date,
          serviceId: serviceId,
          comment: comment
        }); 
      } else{
        newFeedback = await Feedback({
          date: date,
          service: serviceId,
          comment: comment
        }); 
      };

      await newFeedback.save();

      const feedbackDetails = {
        id: newFeedback._id,
        name: name,
        email: email,
        date: date,
        serviceId: serviceId,
        comment: comment
      }
      await sendFeedback(feedbackDetails, email);
      return res.json({status: "success"})
    } return res.json({status: "fail", message: "error"});
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }
});

app.get('/appointmentStats', verifyUser, async(req,res)=>{ // fetch num of upcoming, past appointments. total money spent, days since last appointment
  const userId = req.user?.id;

  if(!userId){
    return res.json({status: "fail", message: "auth"});
  }

  try{
      const dateObj = new Date(new Date().toISOString().split("T")[0] + 'T00:00:00.000Z');
      const upcomingAppointments = await Appointment.find({
        customerId: userId,
        date: {
          $gte: dateObj
        }
      }).populate("serviceId", "price");

      const pastAppointments = await Appointment.find({
        customerId: userId,
        date: {
          $lt: dateObj
        }
      }).sort({"date": -1}).populate("serviceId", "price");

      let allAppointments = [...upcomingAppointments, ...pastAppointments];

      const {totalSpent, lastAppointmentDate} = calculateStats(allAppointments);

      return res.json({status: "success", message: {upcomingAppointmentsCount: upcomingAppointments.length, pastAppointmentsCount: pastAppointments.length, totalSpent, lastAppointmentDate}});
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }
});

app.get('/havePhoneNumber', verifyUser, async(req,res)=>{
  const userId = req.user?.id;

  if(!userId){
    return res.json({status: "fail", message: "auth"});
  }

  try{
    const userFound = await User.findOne({
      _id: userId
    });
    if(userFound){
      if(userFound.phoneNumber){
        return res.json({status: "success", message: true});
      } else{
        return res.json({status: "success", message: false});
      }
    }
    return res.json({status: "fail", message: "error"});
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }
});

app.post('/addPhoneNumber', verifyUser, async(req,res)=>{
  const {phoneNumber} = req.body;
  const userId = req.user?.id;

  if(!phoneNumber || !userId){
    return res.json({status: "fail", message: "error"});
  };

  try{
    const userFound = await User.findOneAndUpdate({_id: userId}, {phoneNumber: phoneNumber});
    if(userFound){
      return res.json({status: "success"});
    };
    return res.json({status: "fail", message: "error"});
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }
});

app.get("/appointment", verifyUser, async(req,res)=>{
  const userId = req.user?.id;

  if(!userId){
    return res.json({status: "fail", message: "auth"});
  }

  try{
    const allAppointments = await Appointment.find({
      customerId: userId
    }).populate("serviceId", "name price durationBlock").populate("staffId", "username email").sort({date: 1, queueMin: 1});

    return res.json({status: "success", message: allAppointments});
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }
});

app.get("/appointment/services", verifyUser, async(req,res)=>{
  try{
    const client = await redisClient;
    let allServices = await client.get('allServices');console.log(allServices)
    if(allServices){
        return res.json({status: "success", message: JSON.parse(allServices)});
    } else{
      allServices = await Service.find({}).populate("staff", "username avatar");
      await client.set("allServices", JSON.stringify(allServices), {
        EX: 36000 
      });
      return res.json({status: "success", message: allServices});
    }
  } catch(err){
    console.log(err);
    return res.json({status: "fail"});
  }
});

app.post("/appointment/timeslot", verifyUser, async(req,res)=>{
  const { staffId, date, service } = req.body; console.log(req.body)

  try{
    const serviceDuration = service.durationBlock;
    const dateString = new Date(date).toISOString().split("T")[0]; 
    const dateObj = new Date(dateString + 'T00:00:00.000Z');
    let allAvailableTimeslot = []

    if(staffId === "any"){
      const serviceFound = await Service.findOne({_id: service._id})
      const allStaffs = serviceFound.staff;
      for(const eachStaffId of allStaffs){
        const allAppointments = await Appointment.find({
        staffId: eachStaffId,
        date: dateObj
        });console.log("allAppointment");

        const allUnavailableTimeslot = await UnavailableTimeslot.find({
          staffId: eachStaffId,
          date: dateObj
        }); 

        const timeslot = generateTimeslot(date, allAppointments, allUnavailableTimeslot);

        for(let i=0; i<=(timeslot.length - serviceDuration); i++){
          let availableTimeslot = true; 
          for(let y=0; y<serviceDuration; y++){
            if(timeslot[i+y].time === ""){
              availableTimeslot = false;
            };
          };
          if(availableTimeslot && !allAvailableTimeslot.find(availableTimeslot => availableTimeslot.queueMin === timeslot[i].queueMin)){ 
            allAvailableTimeslot.push({time: `${timeslot[i].time.split("-")[0].trim()} - ${timeslot[i+serviceDuration-1].time.split("-")[1].trim()}`, queueMin: timeslot[i].queueMin});
            i += serviceDuration - 1;
          } 
        }
      }
  } else{
      const allAppointments = await Appointment.find({
        staffId: staffId,
        date: dateObj
      }); console.log("all");

      const allUnavailableTimeslot = await UnavailableTimeslot.find({
        staffId: staffId,
        date: dateObj
      }); 

      const timeslot = generateTimeslot(date, allAppointments, allUnavailableTimeslot);
      console.log(timeslot.length)
      for(let i=0; i<=(timeslot.length - serviceDuration); i++){
        let availableTimeslot = true; 
        for(let y=0; y<serviceDuration; y++){console.log(timeslot[i+y])
          if(timeslot[i+y]?.time === ""){
            availableTimeslot = false;
          };
        };

        if(availableTimeslot){ 
          allAvailableTimeslot.push({time: `${timeslot[i].time.split("-")[0].trim()} - ${timeslot[i+serviceDuration-1].time.split("-")[1].trim()}`, queueMin: timeslot[i].queueMin});
          i += serviceDuration - 1;console.log("All Available")
        }console.log(allAvailableTimeslot)
      }
    }

    return res.json({status: "success", message: allAvailableTimeslot});
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }
});

app.post("/appointment/makeAppointment", verifyUser, async(req,res)=>{
  let { staffId, date, serviceId, timeslot, paymentMethod } = req.body;
  const dateString = new Date(date).toISOString().split("T")[0]; 
  const dateObj = new Date(new Date(dateString).toISOString().split("T")[0] + 'T00:00:00.000Z');
  const customerId = req.user?.id;
  const customerEmail = req.user?.email;

  if(!customerId || !customerEmail){
    return res.json({status: "fail", message: "auth"})
  }

  try{
    const startedAt = timeslot.time.split("-")[0].trim();
    const endedAt = timeslot.time.split("-")[1].trim();console.log(dateObj);console.log(startedAt)

    const startedAtDate = new Date(`${dateString}T${startedAt}:00.000Z`);
    const endedAtDate = new Date(`${dateString}T${endedAt}:00.000Z`);
    const queueMin = timeslot.queueMin;

    if(customerId && serviceId && staffId && dateObj && startedAt && endedAt){
      if(staffId === "any"){
        const serviceFound = await Service.findOne({
          _id: serviceId
        }); 

        const allStaffIds = serviceFound.staff;

        let selectedStaffId = null;
        for(let staffIdFound of allStaffIds){
          const appointmentFound = await Appointment.findOne({
            date: dateObj,
            staffId: staffIdFound,
            $or: [
              {
                startedAtDate: {$lt: endedAtDate},
                endedAtDate: {$gt: startedAtDate},
              }
            ]
          });
          if(!appointmentFound){
            staffId = staffIdFound;
            break;
          }
        }
        if(staffId === "any"){
          return res.json({status: "fail", message: "duplicate"});
        }
      } else{
        const hasDuplicateAppointment = await Appointment.findOne({
          date: dateObj,
          startedAt: startedAt,
          staffId: staffId
        });

        if(hasDuplicateAppointment){
          return res.json({status: "fail", message: "duplicate"});
        }
      }

      const newAppointment = Appointment({
        customerId,
        serviceId,
        staffId: staffId, 
        date: dateObj, 
        startedAtDate,
        endedAtDate,
        startedAt,
        endedAt,
        queueMin,
        paymentStatus: "UNPAID"
      });
      await newAppointment.save();

      if(paymentMethod === "stripe"){
        const appointmentId = newAppointment._id;
        const service = await Service.findOne({
          _id: serviceId
        });
        const sessionURL = await stripePayment(service, appointmentId, customerEmail);
        return res.json({status: "success", message: sessionURL});
      } else{
        const appointmentSend = await Appointment.findOne({_id: newAppointment._id}).populate("customerId", "username email").populate("serviceId", "name price").populate("staffId", "_id username");
        sendMakeAppointmentDetails(appointmentSend, customerEmail);

        io.emit("newAppointment", appointmentSend);
        return res.json({status: "success"});
      }
      
    } return res.json({status: "fail", message: "error"});
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }
});

app.get("/appointment/paymentSuccess", async(req,res)=>{
  return res.redirect("http://localhost:3000/stripe/paymentSuccess");
});

app.get("/appointment/paymentFailure", async(req,res)=>{
  return res.redirect("http://localhost:3000/stripe/paymentFailure");
});

app.put("/appointment/rescheduleAppointment", verifyUser, async(req,res)=>{
  const customerEmail = req.user?.email; console.log(customerEmail)
  const {id, date, timeslot} = req.body; console.log(req.body)
  try{
    const dateString = new Date(date).toISOString().split("T")[0]; 
    const dateObj = new Date(new Date(dateString).toISOString().split("T")[0] + 'T00:00:00.000Z')
    const startedAt = timeslot.time.split("-")[0].trim();
    const endedAt = timeslot.time.split("-")[1].trim();
    const startedAtDate = new Date(`${dateString}T${startedAt}:00.000Z`);
    const endedAtDate = new Date(`${dateString}T${endedAt}:00.000Z`);
    const queueMin = timeslot.queueMin;

    if(id && timeslot && startedAt && endedAt){
      const appointmentFound = await Appointment.findById(id);
      if(appointmentFound){
        const hasDuplicateAppointment = await Appointment.findOne({
          staffId: appointmentFound.staffId,
          date: dateObj,
          startedAt: startedAt
        });

        if(hasDuplicateAppointment){
          return res.json({status: "fail", message: "duplicate"});
        }

        const appointmentReschedule = await Appointment.findByIdAndUpdate(
          id, {
          date: dateObj,
          startedAt: startedAt,
          endedAt: endedAt,
          startedAtDate: startedAtDate,
          endedAtDate: endedAtDate,
          queueMin: queueMin
        });

        if(appointmentReschedule){
          const appointment = await Appointment.findById(
            id
          ).populate("customerId", "username email").populate("serviceId", "name price").populate("staffId", "_id username");
          sendRescheduleAppointmentDetails(appointment, customerEmail);
          io.emit("rescheduleAppointment", appointment);
          return res.json({status: "success"});
        } return res.json({status: "fail", message: "error"});
      }
       return res.json({status: "fail", message: "error"});
    }
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }
});

app.delete("/appointment/cancelAppointment", verifyUser, async(req,res)=>{
  const customerEmail = req.user?.email;
  const {id} = req.body;
  try{
    const appointmentFound = await Appointment.findById(id).populate("customerId", "username email").populate("serviceId", "name price").populate("staffId", "_id username");
    const appointmentDelete = await Appointment.findByIdAndDelete(id);
    if(appointmentDelete){
      sendDeleteAppointmentDetails(appointmentFound, customerEmail);
      io.emit("cancelAppointment", appointmentFound)
      return res.json({status: "success"});
    } return res.json({status: "fail", message: "error"});
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }
});

app.get("/liveQueue", verifyUser, async(req, res)=>{
  try{
    const client = await redisClient;
    
    const cacheLiveQueue = await client.get('liveQueue');
    if(cacheLiveQueue){
      return res.json({status: "success", message: JSON.parse(cacheLiveQueue)});
    }
    const appointmentsByBarber = await User.aggregate([
      {
        $match: {role: "STAFF"} // fetch users that match the role "STAFF"
      },
      {
        $lookup: { // go look at appointments collection for every staff
          from: "appointments",
          let: {staffId: "$_id"}, // take the staff Id and store in a variable called staffId
          pipeline: [ // run a mini query inside a main query
            {
              $match: {
                $expr: {
                  $and: [ // both expressions need to match
                    { $eq: ["$staffId", "$$staffId"] }, // the staffId need to match
                    { $eq: ["$date", new Date(new Date().toISOString().split("T")[0] + 'T00:00:00.000Z')] } // date of appointment need to match new Date().toISOString().split("T")[0] + 'T00:00:00.000Z'
                  ]
                }
              }
            },
            {
              $lookup: { // get all customer data of the 
                from: "users",
                foreignField: "_id",
                localField: "customerId",
                as: "customer"
              }
            },
            {
              $unwind: "$customer"
            },
            {
              $lookup: {
                from: "services",
                foreignField: "_id",
                localField: "serviceId",
                as: "service"
              }
            },
            {
              $unwind: "$service"
            },
            { $sort: { "queueMin": 1 } }
          ],
          as: "appointments"
        } 
      },
    ]);
    await client.set('liveQueue', JSON.stringify(appointmentsByBarber), {
      EX: 60
    })
    return res.json({status: "success", message: appointmentsByBarber});
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }
});

app.get("/profile", verifyUser, async(req, res)=>{
  const userId = req.user.id;

  if(!userId){
    return res.json({status: "fail", message: "auth"});
  }
  
  try{
    const userFound = await User.findOne({_id: userId}).populate({path: "appointments", populate: {path: "serviceId", model: "Service", select: "price name"}});
    if(!userFound){
      return res.json({status: "fail", message: "auth"});
    };

    const {totalSpent, lastAppointmentDate} = calculateStats(userFound.appointments);

    let allAppointmentPreferences = {};
    let appointmentPreferenceService = null;
    let appointmentPreferenceStaff = null;
    if(userFound.appointments && userFound.appointments.length > 0){
      const allAppointments = await Appointment.find({customerId: userId}).populate("serviceId", "name").populate("staffId", "username");
      for(let appointment of allAppointments){
        const serviceName = appointment.serviceId.name;
        const staffName = appointment.staffId.username;
        const key = `${serviceName}-${staffName}`;

        allAppointmentPreferences[key] = (allAppointmentPreferences[key] || 0) + 1;
      }
      const appointmentPreferences = Object.keys(allAppointmentPreferences).reduce((a,b)=> allAppointmentPreferences[a] > allAppointmentPreferences[b] ? a : b);
      appointmentPreferenceService = appointmentPreferences.split("-")[0];
      appointmentPreferenceStaff = appointmentPreferences.split("-")[1];
    }console.log(allAppointmentPreferences);
    
    const userObj = {_id: userFound._id, username: userFound.username, avatar: userFound.avatar, email: userFound.email, date: userFound.createdAt, phoneNumber: userFound.phoneNumber || null, numberOfAppointments: userFound.appointments.length || 0, totalSpent: totalSpent, styleProfile: userFound.styleProfile, lastAppointmentDate: lastAppointmentDate, appointmentPreferenceService: appointmentPreferenceService, appointmentPreferenceStaff: appointmentPreferenceStaff, emailVerified: userFound.emailVerified, googleVerified: !!(userFound.googleId), facebookVerified: !!(userFound.facebookId)}
    return res.json({status: "success", message: userObj});
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }
})

app.post("/styleProfile", verifyUser, async(req,res)=>{
  const userId = req.user.id;
  const {hairType, barberNotes} = req.body;console.log(req.body)

  if(!userId){
    return res.json({status: "fail", message: "auth"});
  }

  try{
    let userFound = await User.findById(userId);
    if(userFound){
      if(hairType != null){
        userFound.styleProfile.hairType = hairType;
      }
      if(barberNotes !== null){
        userFound.styleProfile.barberNotes = barberNotes;
      }
      await userFound.save();
      return res.json({status: "success"});
    } return res.json({status: "fail", message: "error"});
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }
})

app.post("/changeEmail", verifyUser, async(req,res)=>{
  const userId = req.user.id;
  const {email} = req.body;

  if(!userId){
    return res.json({status: "fail", message: "auth"});
  }

  try{
    const duplicateEmail = await User.findOne({email: email});
    if(duplicateEmail){
      return res.json({status: "fail", message: "duplicate"});
    }

    const userFound = await User.findById(userId);
    if(userFound){
      const emailChangeToken = crypto.randomBytes(32).toString("hex")
      userFound.tempEmail = email;
      userFound.emailChangeToken = emailChangeToken;
      userFound.emailVerified = false;
      await userFound.save();

      const verifyLink = `http://localhost:5000/verifyEmailChange?token=${emailChangeToken}`

      if(sendVerifyEmailChange(email, verifyLink)){
        return res.json({status: "success"});
      } return res.json({status: "fail", message: "error"});
    }
    return res.json({status: "fail", message: "error"});

  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }
})

app.get("/verifyEmailChange", async(req,res)=>{
  const token = req.query.token;

  try{
    if(token){
      let userFound = await User.findOne({emailChangeToken: token});
      if(userFound){
        userFound.email = userFound.tempEmail;
        userFound.emailVerified = true;
        await userFound.save();
        res.redirect("http://localhost:3000/auth/login/changeEmailFallback")
      } return res.json({status: "fail", message: "error"});
    }
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }
})

app.get("/staff", verifyStaff, async(req,res)=>{
  const staffId = req.user.id;

  if(!staffId){
    return res.json({status: "fail", message: "auth"});
  }

  try{
    const staffFound = await User.findById(staffId);
    if(!staffFound){
      return res.json({status: "fail", message: "auth"});
    }

    const pendingAppointmentCount = await Appointment.countDocuments({
      staffId: staffId,
      status: "SCHEDULED" || "IN PROGRESS"
    });

    const completedAppointmentCount = await Appointment.countDocuments({
      staffId: staffId,
      status: "COMPLETED"
    });

    const daysStaff = Math.floor((new Date() - new Date(staffFound.createdAt)) / (24 * 60 * 60 * 1000));

    const totalNumberAppointments = await Appointment.countDocuments();
    const staffNumberAppointments = await Appointment.countDocuments({
      staffId: staffId
    });

    const totalNumberCustomer = await User.countDocuments({
      role: "CUSTOMER"
    });
    const staffNumberCustomerArray = await Appointment.distinct('customerId', {
      staffId: staffId
    });
    const staffNumberCustomer = staffNumberCustomerArray.length;

    const week = [];
    for(let i=0; i>-6; i--){
      const today = new Date();
      today.setDate(today.getDate() + i);
      const dayObj = today.toISOString().split("T")[0] + 'T00:00:00.000Z';
      week.push(dayObj);
    }

    let appointmentWeekStats = [];
    for(let day of week){
      const appointmentStats = await Appointment.countDocuments({date: day, staffId: staffId});
      appointmentWeekStats.push(appointmentStats);
    }

    const allUnavailableTimeslot = await UnavailableTimeslot.find({staffId: staffId, date: {$gte: new Date().toISOString().split("T")[0] + "T00:00:00.000Z"}});

    const allUpomingAppointments = await Appointment.find({staffId: staffId, date: {$gt: new Date(new Date().toISOString().split("T")[0] + 'T00:00:00.000Z')}}).populate("serviceId", "name").populate("customerId", "username");

    const staffObj = {username: staffFound.username, avatar: staffFound.avatar, pendingAppointmentCount, completedAppointmentCount, daysStaff, totalNumberAppointments, staffNumberAppointments, totalNumberCustomer, staffNumberCustomer, week, appointmentWeekStats, allUnavailableTimeslot, allUpomingAppointments};
    console.log(staffObj)
    return res.json({status: "success", message: staffObj});
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }

})

app.get("/staff/appointments", verifyStaff, async(req, res)=>{
  const staffId = req.user.id;

  if(!staffId){
    return res.json({status: "fail", message: "auth"});
  }

  try{
    const dateObj = new Date(new Date().toISOString().split("T")[0] + 'T00:00:00.000Z');

    const allAppointments = await Appointment.find({
      staffId: staffId,
      date: dateObj
    }).populate("customerId", "username styleProfile avatar").populate("serviceId", "name price").sort({queueMin: 1});

    return res.json({status: "success", message: allAppointments});
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }
});

app.put("/staff/appointments/updateStatus", verifyStaff, async(req,res)=>{console.log('status')
  const {id, status} = req.body; console.log(req.body)
  try{
    const email = req.user.email;
    let appointmentUpdateStatus;
    if(status === "COMPLETED"){
      appointmentUpdateStatus = await Appointment.findByIdAndUpdate(id, {status: status, paymentStatus: "PAID"});
    } else{
      appointmentUpdateStatus = await Appointment.findByIdAndUpdate(id, {status: status});
    }
    if(appointmentUpdateStatus){
      const appointmentFound = await Appointment.findById(id).populate("customerId", "username email").populate("serviceId", "name price").populate("staffId", "username email");
      if(status === "IN PROGRESS"){
        sendAppointmentInProgress(appointmentFound, email);
      } else if(status === "COMPLETED"){console.log("send email")
        sendAppointmentCompleted(appointmentFound, email);
      }
      return res.json({status: "success", message: appointmentFound});
    }
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }
});

app.post("/staff/timeslot", verifyStaff, async(req,res)=>{
  const staffId = req.user?.id;
  if(!staffId){
    return res.json({status: "fail", message: "auth"});
  }

  try{
    const {dateSelected} = req.body;
    const dateObj = new Date(dateSelected + 'T00:00:00.000Z');
      const allAppointments = await Appointment.find({
        staffId: staffId,
        date: dateObj
      }); console.log("all");

      const allUnavailableTimeslot = await UnavailableTimeslot.find({
        staffId: staffId,
        date: dateObj
      }); 

      let timeslot = generateTimeslot(dateSelected, allAppointments, allUnavailableTimeslot);
      const updatedTimeslot = timeslot.filter(eachTimeslot => eachTimeslot.time !== "");
      return res.json({status: "success", message: updatedTimeslot})
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }
})

app.post("/staff/unavailableTimeslot", verifyStaff, async(req, res)=>{
    const staffId = req.user?.id;
    if(!staffId){
      return res.json({status: "fail", message: "auth"});
    }

    try{
      const {dateSelected, startedAt, endedAt, reason} = req.body;
      const dateObj = new Date(dateSelected + 'T00:00:00.000Z');
        const unavailableTimeslot = await UnavailableTimeslot({
          staffId: staffId,
          date: dateObj,
          startedAt: startedAt,
          endedAt: endedAt,
          reason: reason
        }); 

      await unavailableTimeslot.save();
      return res.json({status: "success", message: unavailableTimeslot})
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }
})

app.post("/staff/removeUnavailableTimeslot", verifyStaff, async(req,res)=>{
    const staffId = req.user?.id;
    if(!staffId){
      return res.json({status: "fail", message: "auth"});
    }

    try{
      const { unavailableTimeslotId } = req.body;
      if(!unavailableTimeslotId){
        return res.json({status: "fail", message: "error"});
      }
      await UnavailableTimeslot.findByIdAndDelete(unavailableTimeslotId);
      return res.json({status: "success"});
    } catch(err){
      console.log(err);
      return res.json({status: "fail", message: "error"});
    }
})

server.listen(5000, async ()=>{
    await connectMongoose();
    console.log("Server running on port 5000");
})

function calculateStats(appointments){
  const totalSpent = appointments ? appointments.reduce((acc, currentAppointment) => acc += (currentAppointment.paymentStatus === "PAID" ? currentAppointment.serviceId.price : 0), 0) : 0;

  let lastAppointmentDate = "-";
  if(appointments.length > 0){
    const sortedAppointment = appointments.sort((a,b) => new Date(a.date) - new Date(b.date));
    for(let appointment of sortedAppointment){
      if(appointment.status === "COMPLETED"){
        lastAppointmentDate = Math.floor((new Date() - new Date(appointment.date)) / (24 * 60 * 60 * 1000));
      }
    }
  }
  return {totalSpent, lastAppointmentDate}
}