const express = require("express");
const router = express.Router();
const Car = require("../models/car");
const Booking = require("../models/booking");
const Review = require("../models/review");
const {authorization} = require("../middlewares/authorization");
const updateBookingCompletionStatus = async (bookingId) => {
  const booking = await Booking.findById(bookingId);
  if (booking.status == "approved" && booking.endTime < Date.now()) {
    booking.status = "completed";
    const car= await Car.findById(booking.carId);
    if (!car) return res.status(404).send("Car not found");
    car.status = "available";
    await car.save();
    await booking.save();
  }
};
router.get("/", authorization, async (req, res) => {
  if (req.user.role != "admin")
    return res.status(401).send("you are unauthorized");
  const bookings = await Booking.find({ renterId: req.user._id });
  res.send(bookings);
});
router.get("/:renterId", authorization, async (req, res) => {
  if (req.user.role != "owner") {
    let bookings = await Booking.find({ renterId: req.params.renterId });
    if (bookings.length == 0) return res.status(404).send("Booking not found");
    await Promise.all(bookings.map( (booking) =>  updateBookingCompletionStatus(booking._id)));
    bookings= await Booking.find({ renterId: req.params.renterId });
    return res.status(200).send(bookings);
  }
});
router.post("/", authorization, async (req, res) => {
  if (req.user.role != "renter")
    return res.status(401).send("you are unauthorized");

  const { startTime, endTime, totalCost, carId } = req.body;
  const car = await Car.findById(carId).select("ownerId");
  if (!car) return res.status(404).send("Car not found");
  if (car.status != "available")
    return res.status(400).send("Car is not available for booking");
  const ownerId = car?.ownerId;

  const booking = new Booking({
    startTime,
    endTime,
    totalCost,
    carId,
    ownerId,
    renterId: req.user._id,
  });
  await booking.save();
  car.status = "pendingApproval";
  res.send(booking);
});
router.put("/:id", authorization, async (req, res) => {
  if (req.user.role == "renter")
    return res.status(401).send("you are unauthorized");
  if (req.user.role == "owner") {
    if (req.body.status != "approved" && req.body.status != "rejected")
      return res.status(400).send("you are unauthorized");
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, updatedAt: Date.now() },
      { new: true }
    );
    if (!booking) return res.status(404).send("Booking not found");
    const car= await Car.findById(booking.carId);
    if (!car) return res.status(404).send("Car not found");
    car.status = req.body.status=="approved"?"rented":"available";
    await car.save();
    res.send(booking);
  }
  if (req.user.role == "admin") {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!booking) return res.status(404).send("Booking not found");
  }

  res.send(booking);
});
router.delete("/:id", authorization, async (req, res) => {
  if (req.user.role == "owner")
    return res.status(401).send("you are unauthorized");
  const booking = await Booking.findByIdAndDelete(req.params.id);
  if (!booking) return res.status(404).send("Booking not found");
  res.send(booking);
});
module.exports.bookingRouter = router;