const express = require("express");
const router = express.Router();
const Car = require("../models/car");
const Booking = require("../models/booking");
const Review = require("../models/review");
const {authorization} = require("../middlewares/authorization");
const User = require("../models/user");
const bcrypt = require("bcrypt");

const jwt = require('jsonwebtoken');


userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign(
    { _id: this._id, role: this.role, email: this.email, firstName: this.firstName },
    process.env.JWT_PRIVATE_KEY
  );
  return token;
};

router.get("/", authorization, async (req, res) => {
  if (req.user.role != "admin")
    return res.status(401).send("you are unauthorized");
  const users = await User.find();
  res.send(users);
});
router.get("/fetchOwners", async (req, res) => {
  const users = await User.find({ role: "owner" }).select("_id firstName lastName email phoneNumber averageRating reviewersCount");
  if (!users) return res.status(404).send("no owners found");
  res.send(users);
});
router.get("/:id",authorization, async (req, res) => {
  if (req.user.role != "admin" && req.user._id!=req.params.id)
    return res.status(401).send("you are unauthorized");
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).send("User not found");
  res.send(user);
});

router.post("/OwnerAndRenter", async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;
  if (role == "admin") return res.status(401).send("you are unauthorized");
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).send("Email already in use");
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = new User({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role,
  });
  await user.save();
  res.send(user);
});
router.post("/admin", authorization, async (req, res) => {
  if (req.user.role != "admin")
    return res.status(401).send("you are unauthorized");
  const { firstName, lastName, email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).send("Email already in use");
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = new User({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role: "admin",
  });
  await user.save();
  res.send(user);
});
router.put("/refreshAll", authorization, async (req, res) => {
  if (req.user.role != "admin")
    return res.status(401).send("you are unauthorized");
  const users = await User.find();
  await Promise.all(
    users.map(async (user) => {
      const reviews = await Review.find({ reviewedEntityId: user._id });
      if (reviews.length == 0) {
        user.averageRating = 3;
        user.reviewersCount = 0;
        await user.save();
        return;
      }
      let averageRating = 0;
      for (const review of reviews) {
        averageRating += review.rating;
      }
      averageRating /= reviews.length;
      user.averageRating = averageRating;
      user.reviewersCount = reviews.length;
      await user.save();
    })
  );
  res.send(users);
});
router.put("/:id", authorization, async (req, res) => {
  if (req.user.role != "admin" && req.user._id != req.params.id)
    return res.status(401).send("you are unauthorized");

  const { firstName, lastName, email, password } = req.body;

  const updateFields = { firstName, lastName, email };

  if (password) {
    const salt = await bcrypt.genSalt(10);
    updateFields.password = await bcrypt.hash(password, salt);
  }

  const user = await User.findByIdAndUpdate(req.params.id, updateFields, {
    new: true,
  });

  if (!user) return res.status(404).send("User not found");

  res.send(user);
});
router.put("/refreshOne/:id", authorization, async (req, res) => {
  if (req.user.role != "admin" && req.user._id != req.params.id)
    return res.status(401).send("you are unauthorized");
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).send("User not found");
  const reviews = await Review.find({ reviewedEntityId: user._id });
  if (reviews.length == 0) {
    user.averageRating = 3;
    user.reviewersCount = 0;
    await user.save();
    return res.send(user);
  }
  let averageRating = 0;
  for (const review of reviews) {
    averageRating += review.rating;
  }
  averageRating /= reviews.length;
  user.averageRating = averageRating;
  user.reviewersCount = reviews.length;
  await user.save();
  res.send(user);
});
router.delete("/:id", authorization, async (req, res) => {
  if (req.user.role != "admin" && req.user._id != req.params.id)
    return res.status(401).send("you are unauthorized");
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).send("User not found");
  res.send(user);
});
module.exports.userRouter = router;
