const { validationResult } = require("express-validator");

// Import Model
const User = require("../models/User");
const Car_Parking = require("../models/Car_Parking");
const HttpError = require("../models/Http_Error");

const mongoose = require("mongoose");

// Get Car Parking Information by Car Parking Id
const getCarParkingById = async (req, res, next) => {
  const carParkingId = req.params.cpid;

  let carParking;

  try {
    carParking = await Car_Parking.findById(carParkingId);
  } catch (e) {
    const error = new HttpError("Fetching Fail", 404);
    return next(error);
  }

  if (!carParking) {
    const error = new HttpError("Car Parking Not Found", 404);
    return next(error);
  }

  return res.json({ carParking: carParking.toObject({ getters: true }) });
};

// Create the Car Parking
const createCarParking = async (req, res, next) => {
  // Validate the error
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  // Get the data from frontend
  const { starting_time, duration, local_authority, vehicle, creator } =
    req.body;

  // Ensure starting_time is converted to a Date object if it's in ISO string format
  const startTime = new Date(starting_time);
  if (isNaN(startTime.getTime())) {
    return next(new HttpError("Invalid starting time format", 422));
  }

  // Calculate the end time by adding the duration in minutes
  let end_time = new Date(startTime.getTime() + duration * 60 * 1000); // Convert minutes to milliseconds

  // Create Car Parking
  const createdCarParking = new Car_Parking({
    starting_time: startTime,
    end_time,
    duration,
    local_authority,
    vehicle,
    creator,
  });

  let user;

  try {
    user = await User.findById(creator);
  } catch (e) {
    console.error("Error finding user:", e);
    return next(new HttpError("Parking failed, please try later", 500));
  }

  if (!user) {
    return next(new HttpError("User not available", 404));
  }

  try {
    // Start a session
    const sess = await mongoose.startSession();
    sess.startTransaction();

    // Save the new car parking entry
    await createdCarParking.save({ session: sess });

    // Push the car parking ID to the user's parking history
    user.parking_history.push(createdCarParking);

    // Save the user with the updated parking history
    await user.save({ session: sess });

    // Commit the transaction to persist the changes
    await sess.commitTransaction();
    sess.endSession();
  } catch (e) {
    console.error("Error during transaction:", e);
    return next(new HttpError("Creation failed, please try again", 500));
  }

  res.status(201).json({ Car_Parking: createdCarParking });
};

// Extend the Car Parking
const extendCarParking = async (req, res, next) => {};

// Export the Function
exports.getCarParkingById = getCarParkingById;
exports.createCarParking = createCarParking;
exports.extendCarParking = extendCarParking;
