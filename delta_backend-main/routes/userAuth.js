const express = require("express");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const Router = express.Router();
const User = require("../models/user");
Router.post("/", async (req, res) => {
  const user = await User.findOne({ firstName: req.body.firstName, lastName: req.body.lastName });
  if (!user) return res.status(400).send("Invalid name or password");
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).send("Invalid name or password");
  const token = user.generateAuthToken();
  res.header("x-auth-token", token).send(_.pick(user, ["_id", "role"]));
});
module.exports.userAuthRouter = Router;