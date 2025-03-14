
/**
 * This file is responsible for handling user-related operations.
 * It imports necessary modules and sets up the user application.
 * 
 * @module users
 * @requires express
 * @requires cookie-parser
 * @requires path
 * @requires ./js/users.authorize
 * @requires ./js/users.authenticate
 * @requires ./js/users.model
 * @requires ./users.router
 * 
 * @typedef {Object} app - The user application.
 * @property {Function} auth - authentication middlewear.
 * @property {Function} authorizeAdmin - admin authorization middlewear.
 * @property {Function} authorizeBasic - basic authorization middlewear.
 * @property {Object} User - The User model.
 * 
 * @exports users
 */
// import users.server as server - here comes code:
// import all other js files here so that they can be imported from a single file
// rquire all other js files here so that they can be imported from a single file

const express = require("express");
const cookieParser = require("cookie-parser");
const path = require('path');

const auth = require("./js/users.authorize").auth
const authorizeAdmin = require("./js/users.authorize").authorizeAdmin
const authorizeBasic = require("./js/users.authorize").authorizeBasic
const authorizeToken = require("./js/users.authorize").authorizeToken
const {loginUser, registerUser, updateUser, deleteUser, getAllUsers, getUser, createNewUser} = require("./js/users.authenticate");
const User = require("./js/users.model")
    



const connectDB = require("./js/users.db"); // not required if a db connection exists
// connectDB(); 


 
const userApp = express();
const userRouter = require("./js/users.router");
// add view folder to existing app view paths
// mount 'client' folder
userApp.use('/static', express.static(path.join(__dirname, 'client')))

userApp.use(express.json());
userApp.use(cookieParser());
userApp.use(userRouter);




const user = {
    app: userApp,
    auth,
    authorizeAdmin, 
    authorizeBasic,
    authorizeToken,
    User,
    connectDB
}

    

// add all imports to export
module.exports = user;

