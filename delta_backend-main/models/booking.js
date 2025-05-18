const mongoose = require("mongoose");
const bookingSchema = new mongoose.Schema({
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  totalCost: { type: Number, required: true },
  requestTime: { type: Date, default: Date.now() },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "completed"],
    default: "pending",
  },
  confirmationTime: { type: Date },
  cancellationTime: { type: Date },
  cancellationReason: { type: String },
  renterId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  carId: { type: mongoose.Schema.Types.ObjectId, ref: "car" },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
},{timestamps: true});

const Booking = mongoose.model("booking", bookingSchema);
module.exports = Booking;
