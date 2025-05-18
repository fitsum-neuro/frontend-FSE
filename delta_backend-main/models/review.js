const mongoose = require("mongoose");
const reviewSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "booking" },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: "{VALUE} is not an integer",
    },
  },
  comment: { type: String, required: true },
  reviewedEntity: {
    type: String,
    enum: ["owner", "renter", "car"],
    required: true,
  },
  reviewedEntityId: { type: mongoose.Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
});

const Review = mongoose.model("review", reviewSchema);
module.exports = Review;
