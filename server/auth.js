const jwt = require("jsonwebtoken");

async function verifyUser(req, res, next){
    try{
        const accessTokenPass = req.cookies.accessToken;
        try{
          const decoded = jwt.verify(accessTokenPass, process.env.JWT_SECRET);
          console.log(decoded)
          if(decoded.role === "CUSTOMER" || decoded.role === "ADMIN"){
            req.user = decoded;
            next();
          } else{
            return res.json({status: "fail", message: "auth"});
          }
        } catch(err){
          console.log(err);

          if(err.name === "TokenExpiredError"){
            return res.json({status: "fail", message: "expired"})
          };
          return res.json({status: "fail", message: "auth"});
        }
    } catch(err){
        console.log(err);
        return res.json({status: "fail", message: "auth"});
    }
}

async function verifyStaff(req, res, next){
  try{
    const accessTokenPass = req.cookies.accessToken;
    try{
      const decoded = jwt.verify(accessTokenPass, process.env.JWT_SECRET);
      if(decoded.role === "STAFF"){
        req.user = decoded;
        next();
      } else{
        return res.json({status: "fail", message: "auth"});
      }
    } catch(err){
      console.log(err);

      if(err.name === "TokenExpiredError"){
        return res.json({status: "fail", message: "expired"})
      };
      return res.json({status: "fail", message: "auth"});
    }
  } catch(err){
    console.log(err);
    return res.json({status: "fail", message: "auth"});
  }
} 

async function verifyAdmin(req, res, next){
    try{
        const accessTokenPass = req.cookies.accessToken;
        try{
          const decoded = jwt.verify(accessTokenPass, process.env.JWT_SECRET);
          console.log(decoded)
          if(decoded.role === "ADMIN"){
            req.user = decoded;
            next();
          } else{
            return res.json({status: "fail", message: "auth"});
          }
        } catch(err){
          console.log(err);

          if(err.name === "TokenExpiredError"){
            return res.json({status: "fail", message: "expired"})
          };
          return res.json({status: "fail", message: "auth"});
        }
    } catch(err){
        console.log(err);
        return res.json({status: "fail", message: "auth"});
    }
}

module.exports = {verifyUser, verifyStaff, verifyAdmin};