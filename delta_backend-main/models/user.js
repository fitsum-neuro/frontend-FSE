const mongoose = require("mongoose");
const config = require("config");
const jwt = require("jsonwebtoken");
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "owner", "renter"],
  },
  averageRating: { type: Number, default: 3 },
  reviewersCount: { type: Number, default: 0 },
},{timestamps: true});
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      role: this.role,
    },
    config.get("jwtPrivateKey")
  );
  return token;
};
const User = mongoose.model("user", userSchema);
module.exports = User;
