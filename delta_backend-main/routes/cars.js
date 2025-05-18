const express = require("express");
const router = express.Router();
const Car = require("../models/car");
const Booking = require("../models/booking");
const Review = require("../models/review");
const User = require("../models/user");
const { authorization } = require("../middlewares/authorization");

router.get("/", async (req, res) => {
  const cars = await Car.find();
  if (!cars) return res.status(404).send("no cars found");
  res.send(cars);
});

router.get("/:id", async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).send("Car not found");
  res.send(car);
});
router.get("/byOwner/:ownerId", async (req, res) => {
  const cars = await Car.find({ ownerId: req.params.ownerId });
  if (cars.length == 0) return res.status(404).send("no cars found");
  res.send(cars);
});
router.post("/", authorization, async (req, res) => {
  if (req.user.role != "owner")
    return res.status(401).send("you are unauthorized");
  const {
    make,
    model,
    year,
    licensePlate,
    carType,
    transmission,
    fuelType,
    seats,
    hourlyPrice,
    locationCity,
    locationNeighborhood,
  } = req.body;
  const description = req.body.description || "";
  const features = req.body.features || [];
  const photos = req.body.photos || [];
  const availabileAfter = new Date(req.body.availabileAfter) || new Date(Date.now());
  const car = new Car({
    make,
    model,
    year,
    licensePlate,
    carType,
    transmission,
    fuelType,
    seats,
    hourlyPrice,
    locationCity,
    locationNeighborhood,
    availabileAfter: availabileAfter,
    ownerId: req.user._id,
    description,
    features,
    photos,
  });
  await car.save();
  res.send(car);
});
router.put("/:id", authorization, async (req, res) => {
  if (req.user.role == "owner") {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).send("Car not found");
    if (!car.ownerId.equals(req.user._id))
      return res.status(401).send("you are unauthorized");
    
    if (req.body.description) car.description = req.body.description;
    if (req.body.features) car.features = req.body.features;
    if (req.body.photos) car.photos = req.body.photos;
    if (req.body.hourlyPrice) car.hourlyPrice = req.body.hourlyPrice;
    if (req.body.locationCity) car.locationCity = req.body.locationCity;
    if (req.body.locationNeighborhood) car.locationNeighborhood = req.body.locationNeighborhood;
    if (req.body.status && (req.body.status == "available" || req.body.status == "unavailable" || req.body.status== "underMaintenance")) car.status = req.body.status;
    if (req.body.availabileAfter) {
      if (new Date(new Date(req.body.availabileAfter)) < Date.now())
        return res
          .status(400)
          .send("availabileAfter date must be in the future");
      if (
        req.body.status == "available" &&
        new Date(req.body.availabileAfter) > Date.now()
      ) {
        car.status = "unavailable";
      } else {
        car.availabileAfter = new Date(req.body.availabileAfter);
      }
    }
    
    await car.save();
    return res.send(car);
  }else if (req.user.role == "admin") {
    const car= await Car.findById(req.params.id);
    if (!car) return res.status(404).send("Car not found");
    if(req.body.make) car.make = req.body.make;
    if(req.body.model) car.model = req.body.model;
    if(req.body.year) car.year = req.body.year;
    if(req.body.licensePlate) car.licensePlate = req.body.licensePlate;
    if(req.body.description) car.description = req.body.description;
    if(req.body.features) car.features = req.body.features;
    if(req.body.photos) car.photos = req.body.photos;
    if((req.body.availabileAfter)) car.availabileAfter = new Date(req.body.availabileAfter);
    if(req.body.carType) car.carType = req.body.carType;
    if(req.body.transmission) car.transmission = req.body.transmission;
    if(req.body.fuelType) car.fuelType = req.body.fuelType;
    if(req.body.seats) car.seats = req.body.seats;
    if(req.body.hourlyPrice) car.hourlyPrice = req.body.hourlyPrice;
    if(req.body.locationCity) car.locationCity = req.body.locationCity;
    if(req.body.locationNeighborhood) car.locationNeighborhood = req.body.locationNeighborhood;
    await car.save();
    return res.send(car);
  }else{
    return res.status(401).send("you are unauthorized");
  }
});
router.delete("/:id", authorization, async (req, res) => {
  if (req.user.role != "owner" && req.user.role != "admin")
    return res.status(401).send("you are unauthorized");
  const car = await Car.findByIdAndDelete(req.params.id);
  if (!car) return res.status(404).send("Car not found");
  res.send(car);
});
module.exports.carRouter = router;
