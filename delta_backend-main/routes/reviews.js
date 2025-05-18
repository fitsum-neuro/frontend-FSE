const express = require("express");
const router = express.Router();
const Car = require("../models/car");
const Booking = require("../models/booking");
const Review = require("../models/review");
const User = require("../models/user");
const { authorization } = require("../middlewares/authorization");

router.get("/", authorization, async (req, res) => {
  if (req.user.role != "admin")
    return res.status(401).send("you are unauthorized");
  const reviews = await Review.find();
  if (!reviews) return res.status(404).send("no reviews found");
  res.send(reviews);
});
router.get("/myReviews/:reviewedEntityId", authorization, async (req, res) => {
  if (req.user._id != req.params.reviewedEntityId)
    return res.status(401).send("you are unauthorized");
  const reviews = await Review.find({
    reviewedEntityId: req.params.reviewedEntityId,
  });
  if (reviews.length == 0) return res.status(404).send("no reviews found");
  res.send(reviews);
});
router.get("/byCar/:carId", authorization, async (req, res) => {
  const reviews = await Review.find({ reviewedEntityId: req.params.carId });
  if (!reviews) return res.status(404).send("no reviews found");
  res.send(reviews);
});
router.post("/car/:carId", authorization, async (req, res) => {
  if (req.user.role == "admin"){
    return res.status(401).send("you are unauthorized");
  }else if (req.user.role == "renter") {
    const alreadyReviewed = await Review.findOne({
      reviewedEntityId: req.params.carId,
      reviewerId: req.user._id,
    });
    if (alreadyReviewed)
      return res.status(400).send("you already reviewed this car");
    const booking = await Booking.findOne({ renterId: req.user._id, carId: req.params.carId });
    if (!booking)
      return res.status(404).send("can't review a car you didn't booked");

    if(booking.status != "completed") return res.status(401).send("you can't review a car you didn't used completely");
    
    const review = new Review({
      bookingId: booking._id,
      reviewerId: req.user._id,
      rating: req.body.rating,
      comment: req.body.comment,
      reviewedEntity: "car",
      reviewedEntityId: req.params.carId,
    });
    await review.save();
    return res.status(200).send(review);
  }else{
    return res.status(401).send("you are unauthorized");
  }
});
router.post("/owner/:ownerId", authorization, async (req, res) => {
  if(req.user.role=="admin"){
    return res.status(401).send("you are unauthorized");
  }else if(req.user.role=="renter"){
    const alreadyReviewed = await Review.findOne({
      reviewedEntityId: req.params.ownerId,
      reviewerId: req.user._id,
    });
    if (alreadyReviewed)
      return res.status(400).send("you already reviewed this car owner");
    const booking= await Booking.findOne({ renterId: req.user._id, ownerId: req.params.ownerId });
    if (!booking)
      return res.status(404).send("can't review a car you didn't booked");
    if(booking.status != "completed") return res.status(401).send("you can't review a car you didn't used completely");
    const review = new Review({
      bookingId: booking._id,
      reviewerId: req.user._id,
      rating: req.body.rating,
      comment: req.body.comment,
      reviewedEntity: "owner",
      reviewedEntityId: req.params.ownerId,
    });
    await review.save();
    return res.status(200).send(review);
  }else{
    return res.status(401).send("you are unauthorized");
  }
});
router.post("/renter/:renterId", authorization, async (req, res) => {
  if(req.user.role=="admin"){
    return res.status(401).send("you are unauthorized");
  }else if(req.user.role=="owner"){
    const alreadyReviewed = await Review.findOne({
      reviewedEntityId: req.params.renterId,
      reviewerId: req.user._id,
    });
    if (alreadyReviewed)
      return res.status(400).send("you already reviewed this car renter");
    const booking= await Booking.findOne({ ownerId: req.user._id, renterId: req.params.renterId });
    if (!booking)
      return res.status(404).send("can't review a car you didn't booked");
    if(booking.status != "completed") return res.status(401).send("you can't review a car you didn't used completely");
    
    const review = new Review({
      reviewerId: req.user._id,
      rating: req.body.rating,
      comment: req.body.comment,
      reviewedEntity: "renter",
      reviewedEntityId: req.params.renterId,
    });
    await review.save();
    return res.status(200).send(review);
  }else{
    return res.status(401).send("you are unauthorized");
  }
});
router.put("/:id", authorization, async (req, res) => {
  if (req.user.role == "admin")
    return res.status(401).send("you are unauthorized");
  const review=await Review.findById(req.params.id);
  if (!review) return res.status(404).send("Review not found");
  if (!review.reviewerId.equals(req.user._id)) {
    return res.status(401).send("You are unauthorized");
  }

  review.rating = req.body.rating;
  review.comment = req.body.comment;
  await review.save();
  res.send(review);
});
router.delete("/:id", authorization, async (req, res) => {
  if (req.user.role != "admin")
    return res.status(401).send("you are unauthorized");
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) return res.status(404).send("Review not found");
  res.send(review);
});
module.exports.reviewRouter = router;
