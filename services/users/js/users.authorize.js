const jwt = require("jsonwebtoken");
const User = require("./users.model");
require('dotenv').config();
// const jwtSecret = "4715aed3c946f7b0a38e6b534a9583628d84e96d10fbc04700770d572af3dce43625dd";
const jwtSecret = process.env.JWT_SECRET;

// generic auth function not as middleware
// takes only the token and allowed roles as arguments
// returns {success:true/false, user: null/decodedtoken, message: "error message"}



async function authorizeToken (token, allowedRoles = ["admin", "basic"]) {
  if (token) {
    try {
      const decodedToken = jwt.verify(token, jwtSecret);
      // if user role is an array:
      
      if(Array.isArray(decodedToken.role)){
        userHasOneOfAuthorizedRoles = allowedRoles.some(role => decodedToken.role.includes(role));
      } else {
        userHasOneOfAuthorizedRoles = allowedRoles.includes(decodedToken.role);
      }

      if (userHasOneOfAuthorizedRoles) {
        return {success: true, user: decodedToken};
      } else {
        return {success: false, user: null, message: "Not authorized, must be one of " + allowedRoles};
      }
    } catch (err) {
      return {success: false, user: null, message: "Not authorized, decoding error"};
    }
  } else {
    return {success: false, user: null, message: "Not authorized, token not available"};
  }
}


// generic auth function as middleware
// expects req to contain:
// req.cookies.jwt - token
// req.authorizedRoles - array of roles that are allowed to access the route
// adds to req.body:
// req.body.authorized - true/false
// req.body.user - decoded token or null
function auth (req, res, next) {

  const token = req.cookies.jwt;
  
  if(!req.body){req.body = {};}

  if (token) {
    jwt.verify(token, jwtSecret, async (err, decodedToken) => {
      console.log("decodedToken", decodedToken);
      if (err) {
        req.body.authorized = false;
        req.body.user = null;
        // this middlewear function only checks if token is valid, and adds verified user to req.body or adds to req.authorized = false
        // it does not send a response, so that the route handler can send a response
        next();
        return;

      } else {
        // is any user role in array of authorized roles?
        // if user role is an array:
        if(Array.isArray(decodedToken.role)){
        userHasOneOfAuthorizedRoles = req.authorizedRoles.some(role => decodedToken.role.includes(role));
        } else {
          userHasOneOfAuthorizedRoles = req.authorizedRoles.includes(decodedToken.role);
        }

        if (userHasOneOfAuthorizedRoles) {
          // get .data from user if it exists
          
          req.body.user = decodedToken;
          userData = await User.findById(decodedToken.id)
          if(userData){req.body.user = {id:userData._id, name: userData.username, role:userData.role};}
          req.body.authorized = true;
          next();
          return;
        } else {
          // return res.status(401).json({ message: "Not authorized, must be one of " + req.authorizedRoles });
          // instead, add to req.body and let route handler send response
          req.body.authorized = false;
          req.body.user = null;
          next();
          return;
        }
      }
    });
  } else {
    req.body.authorized = false;
    req.body.user = null;
    next()
    return;
  }
};

// admin auth function

function authorizeAdmin (req, res, next) {
  req.authorizedRoles = ["admin", "superadmin"];
  auth(req, res, next);
}

// basic auth function

function authorizeBasic (req, res, next) {
  console.log("authorizeBasic");
  
  req.authorizedRoles = ["superadmin", "admin", "basic"];
  auth(req, res, next);
}


// export as single object
module.exports = { authorizeToken, authorizeAdmin, authorizeBasic, auth };