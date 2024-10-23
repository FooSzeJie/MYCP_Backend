const { validationResult } = require("express-validator");

// Import Model
const Vehicle = require("../models/Vehicle");
const User = require("../models/user");
const HttpError = require("../models/Http_Error");

const mongoose = require("mongoose");

// Get vehicle information by user id
const getVehicleByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithVehicle;

  try {
    // Find the vehicle by user id
    userWithVehicle = await User.findById(userId).populate("vehicles");
  } catch (e) {
    const error = new HttpError("Fetching Fail", 404);
    return next(error);
  }

  // if (!userWithVehicle || userWithVehicle.vehicles.length === 0) {
  if (!userWithVehicle) {
    const error = new HttpError("The user haven't create the Vehicle", 500);

    return next(error);
  }

  res.json({
    vehicles: userWithVehicle.vehicles.map((vehicle) =>
      vehicle.toObject({ getters: true })
    ),
  });
};

// Get vehicle information by vehicle id
const getVehicleById = async (req, res, next) => {
  const vehicleId = req.params.vid;

  let vehicle;

  try {
    vehicle = await Vehicle.findById(vehicleId);
  } catch (e) {
    const error = new HttpError("Fetching Fail", 404);
    return next(error);
  }

  if (!vehicle) {
    const error = new HttpError("Vehicle not found", 404);

    return next(error);
  }

  return res.json({ vehicle: vehicle.toObject({ getters: true }) });
};

// Create Vehicle Function
const createVehicle = async (req, res, next) => {
  // Validator the Error
  const errors = validationResult(req);

  // if having error
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { license_plate, brand, color, creator } = req.body;

  const createdVehicle = new Vehicle({
    license_plate, // title : title;
    brand,
    color,
    creator,
    // creator: req.userData.userId,
  });

  let user;

  try {
    user = await User.findById(creator);
    //   user = await User.findById(req.userData.userId);
  } catch (e) {
    const error = new HttpError(
      "Creating Vehicle failed, please try later",
      500
    );

    return next(error);
  }

  if (!user) {
    const error = new HttpError("User not available", 404);

    return next(error);
  }

  console.log(user);

  try {
    // sess === session
    // Starting the Session
    const sess = await mongoose.startSession();

    // Starting The Transition
    sess.startTransaction();

    // Store the data into db
    await createdVehicle.save({ session: sess });

    // Push is one of the mongoose method to store the vehicle id to user table vehicle attributes
    user.vehicles.push(createdVehicle);

    // Store the data to the db by User Model
    await user.save({ session: sess });

    // Submit the Transition, only this step will update the db
    await sess.commitTransaction();
  } catch (e) {
    const error = new HttpError("Created Fail !", 500);

    return next(error);
  }

  res.status(201).json({ vehicle: createdVehicle });
};

// Update Vehicle Function
const updateVehicleById = async (req, res, next) => {
  // validator the Error
  const errors = validationResult(req);

  // If having Error
  if (!errors.isEmpty()) {
    const error = new HttpError(
      "Invalid inputs passed, please check your data.",
      422
    );

    return next(error);
  }

  const vehicleId = req.params.vid;

  const { license_plate, brand, color } = req.body;

  let vehicle;

  try {
    // Find the vehicle by id
    vehicle = await Vehicle.findById(vehicleId);
  } catch (e) {
    const error = new HttpError("Not Found !", 404);

    return next(error);
  }

  // Update the new item
  vehicle.license_plate = license_plate;
  vehicle.brand = brand;
  vehicle.color = color;

  try {
    // Update the data
    await vehicle.save();
  } catch (e) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500
    );

    return next(error);
  }

  // result
  res.status(200).json({ vehicle: vehicle.toObject({ getters: true }) });
};

// Delete Vehicle Function
const deleteVehicleById = async (req, res, next) => {
  // Get the vehicle id from the path
  const vehicleId = req.params.vid;

  let vehicle;

  try {
    // Find the data by id
    vehicle = await Vehicle.findById(vehicleId).populate("creator");
  } catch (e) {
    const error = new HttpError(
      "Something went wrong, could not delete vehicle",
      500
    );

    return next(error);
  }

  // Check the vehicle whether exists or not
  if (!vehicle) {
    return next(new HttpError("Vehicle is not Found", 404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    // Delete the data
    await vehicle.deleteOne({ session: sess });
    // await sess.deleteOne({ _id: vehicleId });

    vehicle.creator.vehicles.pull(vehicle);

    await vehicle.creator.save({ session: sess });

    await sess.commitTransaction();
  } catch (e) {
    const error = new HttpError(
      "Something Went wrong, could not delete vehicle",
      500
    );

    return next(error);
  }

  res.status(200).json({ message: "Delete vehicle" });
};

// Export the Function
exports.getVehicleByUserId = getVehicleByUserId;
exports.getVehicleById = getVehicleById;
exports.createVehicle = createVehicle;
exports.updateVehicleById = updateVehicleById;
exports.deleteVehicleById = deleteVehicleById;
