const { validationResult } = require("express-validator");

// Import Model
const Saman = require("../models/Saman");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const HttpError = require("../models/Http_Error");

const mongoose = require("mongoose");

const createSaman = async (req, res, next) => {
  // Validator the Error
  const errors = validationResult(req);

  // if having error
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { name, date, license_Plate, creator } = req.body;

  const createdSaman = new Saman({
    name,
    date,
    vehicle: license_Plate,
    creator,
  });

  let user;

  try {
    user = await User.findById(creator);
    //   user = await User.findById(req.userData.userId);
  } catch (e) {
    const error = new HttpError("Creating Saman failed, please try later", 500);

    return next(error);
  }

  if (!user) {
    const error = new HttpError("User not available", 404);

    return next(error);
  }

  let vehicle;

  try {
    vehicle = await Vehicle.findById(license_Plate);
  } catch (e) {
    const error = new HttpError("Creating Saman failed, please try later", 500);

    return next(error);
  }

  if (!vehicle) {
    const error = new HttpError("Vehicle not available", 404);

    return next(error);
  }

  try {
    // Starting the Session
    const sess = await mongoose.startSession();

    // Starting The Transition
    sess.startTransaction();

    // Store the data into db
    await createdSaman.save({ session: sess });

    // Push is one of the mongoose method to store the saman id to user table given_saman attributes
    user.given_saman.push(createdSaman);

    // Store the data to the db by User Model
    await user.save({ session: sess });

    // Push is one of the mongoose method to store the saman id to vehicle table saman_history attributes
    vehicle.saman_history.push(createdSaman);

    // Store the data to the db by User Model
    await vehicle.save({ session: sess });

    // Submit the Transition, only this step will update the db
    await sess.commitTransaction();
  } catch (e) {
    const error = new HttpError("Created Fail !", 500);

    return next(error);
  }

  res.status(201).json({ saman: createdSaman });
};

// Export the Function
exports.createSaman = createSaman;
