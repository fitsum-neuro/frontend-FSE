// userAuth.js
const express = require("express");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const Router = express.Router();
const User = require("../models/user"); 

Router.post("/", async (req, res) => {
  // Find user by email (MODIFIED)
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send({ message: "Invalid email or password." }); 

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).send({ message: "Invalid email or password." }); 

  const token = user.generateAuthToken(); 

  res.header("x-auth-token", token).send({
    message: "Login successful",
    token: token,
    user: _.pick(user, ["_id", "firstName", "lastName", "email", "role"]) 
  });
});

module.exports.userAuthRouter = Router;
