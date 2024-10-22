const { validationResult } = require("express-validator");

// Import Model
const Vehicle = require("../models/Vehicle");
const User = require("../models/user");
const HttpError = require("../models/Http_Error");

const mongoose = require("mongoose");

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

// Export the Function
exports.createVehicle = createVehicle;
