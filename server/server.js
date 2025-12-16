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
const { Server } = require("socket.io");

const User = require("./models/user");
const Service = require("./models/service");
const Appointment = require("./models/appointment");
const UnavailableTimeslot = require("./models/unavailableTimeslot");

const connectMongoose = require('./connectMongoose');
const generateCookie = require('./generateCookie');
const {sendVerificationEmail, sendMakeAppointmentDetails, sendRescheduleAppointmentDetails, sendDeleteAppointmentDetails, sendAppointmentInProgress, sendAppointmentCompleted} = require('./sendEmail');
const {verifyUser, verifyStaff, verifyAdmin} = require('./auth');
const generateTimeslot = require('./generateTimeslot');
const stripePayment = require('./stripePayment');
const scheduleSMS = require('./scheduleSMS');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    limit: 500,
    standardHeaders: true, 
    legacyHeaders: true, 
    ipv6Subnet: 56, 
});

let redisClient;
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
    }
    return res.redirect("http://localhost:3000/");
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
    }
    return res.redirect("http://localhost:3000/");
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
    });

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
      return res.json({status: "fail", message: "error"});
    } else if(user && !user.emailVerified){
      return res.json({status: "fail", message: "email not verified"});
    } else{
      return res.json({status: "fail", message: "error"});
    }
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
    const allServices = await Service.find({}).populate("staff", "username avatar");
    return res.json({status: "success", message: allServices});
  } catch(err){
    console.log(err);
    return res.json({status: "fail"});
  }
});

app.post("/appointment/timeslot", verifyUser, async(req,res)=>{
  const { staffId, date, serviceDuration } = req.body; 

  try{
    const dateObj = new Date(date + 'T00:00:00.000Z');
    const allAppointments = await Appointment.find({
      staffId: staffId,
      date: dateObj
    });

    const allUnavailableTimeslot = await UnavailableTimeslot.find({
      staffId: staffId,
      date: dateObj
    }); 

    const timeslot = generateTimeslot(date, allAppointments, allUnavailableTimeslot)

    let allAvailableTimeslot = [];
    for(let i=0; i<(timeslot.length - serviceDuration); i++){
      let availableTimeslot = true; 
      for(let y=0; y<serviceDuration; y++){
        if(timeslot[i+y].time === ""){
          availableTimeslot = false;
        };
      }; 

      if(availableTimeslot){ 
        allAvailableTimeslot.push({time: `${timeslot[i].time.split("-")[0].trim()} - ${timeslot[i+serviceDuration-1].time.split("-")[1].trim()}`, queueMin: timeslot[i].queueMin});
        i += serviceDuration - 1;
      }
    }console.log(allAvailableTimeslot);console.log(timeslot)

    return res.json({status: "success", message: allAvailableTimeslot});
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }
});

app.post("/appointment/makeAppointment", verifyUser, async(req,res)=>{
  const { staffId, date, serviceId, timeslot, paymentMethod } = req.body;
  const customerId = req.user?.id;
  const customerEmail = req.user?.email;

  if(!customerId || !customerEmail){
    return res.json({status: "fail", message: "auth"})
  }

  try{
    const startedAt = timeslot.time.split("-")[0].trim();
    const endedAt = timeslot.time.split("-")[1].trim();console.log(date);console.log(startedAt)

    const startedAtDate = new Date(`${date}T${startedAt}:00.000Z`);
    const endedAtDate = new Date(`${date}T${endedAt}:00.000Z`);
    const queueMin = timeslot.queueMin;

    if(customerId && serviceId && staffId && date && startedAt && endedAt){
      const hasDuplicateAppointment = await Appointment.findOne({
        date: date,
        startedAt: startedAt
      });

      if(hasDuplicateAppointment){
        return res.json({status: "fail", message: "duplicate"});
      }

      const newAppointment = Appointment({
        customerId,
        serviceId,
        staffId, 
        date, 
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
  const customerEmail = req.user?.email;
  const {id, date, timeslot} = req.body;
  try{
    const startedAt = timeslot.time.split("-")[0].trim();
    const endedAt = timeslot.time.split("-")[1].trim();
    const startedAtDate = new Date(`${date}T${startedAt}:00.000Z`);
    const endedAtDate = new Date(`${date}T${endedAt}:00.000Z`);
    const queueMin = timeslot.queueMin;

    if(id && timeslot && startedAt && endedAt){
       const hasDuplicateAppointment = await Appointment.findOne({
        date: date,
        startedAt: startedAt
      });

      if(hasDuplicateAppointment){
        return res.json({status: "fail", message: "duplicate"});
      }

      const appointmentReschedule = await Appointment.findByIdAndUpdate(
        id, {
        date: date,
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
    // const appointmentsByBarber = await Appointment.aggregate([
    //   {
    //     $match: { date: new Date(new Date().toISOString().split("T")[0] + 'T00:00:00.000Z')}, // filter by today date
    //   },
    //   {
    //     $lookup: { // left join User table
    //       from: "users", // collection name
    //       localField: "customerId", // take staffId from Appointment
    //       foreignField: "_id", // find matching _id in Users
    //       as: "customer" // field name
    //     }
    //   },
    //   {
    //     $lookup: {
    //       from: "users",
    //       localField: "staffId",
    //       foreignField: "_id",
    //       as: "staff"
    //     }
    //   },
    //   {
    //     $lookup: {
    //       from: "services",
    //       localField: "serviceId",
    //       foreignField: "_id",
    //       as: "service"
    //     }
    //   },
    //   {
    //     $unwind: "$customer" // convert customer data to object instead of array
    //   },
    //   {
    //     $unwind: "$staff"
    //   },
    //   {
    //     $unwind: "$service"
    //   },
    //   {
    //     $sort: {"queueMin": 1}
    //   },
    //   {
    //     $group: {
    //       _id: "$staffId", // group by staffId
    //       staff: {$first: "$staff"}, // keep staff info
    //       appointments: {$push: "$$ROOT"}, // put data in a list
    //       count: {$sum: 1} // add count
    //     }
    //   }
    // ]);console.log(appointmentsByBarber)

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
                    { $eq: ["$date", new Date("2025-12-08T00:00:00.000+00:00")] } // date of appointment need to match new Date().toISOString().split("T")[0] + 'T00:00:00.000Z'
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
    ]); console.log(appointmentsByBarber)
    return res.json({status: "success", message: appointmentsByBarber});
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }
});

app.get("/staff/appointments", verifyStaff, async(req, res)=>{
  const staffId = req.user.id;

  if(!staffId){
    return res.json({status: "fail", message: "error"});
  }

  try{
    const dateObj = new Date(new Date().toISOString().split("T")[0] + 'T00:00:00.000Z');

    const allAppointments = await Appointment.find({
      staffId: staffId,
      date: dateObj
    }).populate("customerId", "username").populate("serviceId", "name").sort({queueMin: 1});

    return res.json({status: "success", message: allAppointments});
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "error"});
  }
});

app.put("/appointment/updateStatus", verifyStaff, async(req,res)=>{
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

app.post('/admin', verifyAdmin, async(req,res)=>{

});

server.listen(5000, async ()=>{
    await connectMongoose();
    console.log("Server running on port 5000");
})