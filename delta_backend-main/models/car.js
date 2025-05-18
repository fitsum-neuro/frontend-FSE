const mongoose = require("mongoose");
const carSchema = new mongoose.Schema({
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  licensePlate: { type: String, required: true },
  description: { type: String },
  carType: { type: String, required: true },
  transmission: { type: String, required: true },
  fuelType: { type: String, required: true },
  seats: { type: Number, required: true },
  features: [String],
  hourlyPrice: { type: Number, required: true },
  locationCity: { type: String, required: true },
  locationNeighborhood: { type: String, required: true },
  photos: [String],
  availabileAfter: { type: Date, required: true, default: Date.now() },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  status:{
    type: String,
    enum: ["available", "unavailable","rented", "underMaintenance","pendingApproval", "suspendedByAdmin", "suspendedByOwner"],
    default: "available",
  },
  averageRating: { type: Number, default: 3 },
},{timestamps: true});

const Car = mongoose.model("car", carSchema);
module.exports = Car;
