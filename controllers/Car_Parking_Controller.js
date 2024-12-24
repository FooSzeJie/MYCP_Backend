const { validationResult } = require("express-validator");

// Import Model
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const Car_Parking = require("../models/Car_Parking");
const HttpError = require("../models/Http_Error");

const mongoose = require("mongoose");

// Get Car Parking Information by Car Parking Id
const getCarParkingById = async (req, res, next) => {
  const carParkingId = req.params.cpid;

  let carParking;

  try {
    carParking = await Car_Parking.findById(carParkingId);
    // carParking = await Car_Parking.findById(carParkingId).populate(
    //   "vehicle",
    //   "license_plate"
    // );
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

// Get Car Parking status by User Id
const getCarParkingByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithParkingHistory;

  try {
    // Find the user by ID and populate the parking history
    userWithParkingHistory = await User.findById(userId).populate({
      path: "parking_history",
      match: { status: "ongoing" }, // Filter only "ongoing" car parking
      populate: { path: "vehicle", select: "license_plate" }, // Populate vehicle inside parking history
    });

    // Check if the user exists
    if (!userWithParkingHistory) {
      return next(new HttpError("User not found", 404));
    }
  } catch (e) {
    console.error("Error fetching car parking history:", e);
    const error = new HttpError(
      "Fetching car parking data failed, please try again",
      500
    );
    return next(error);
  }

  // Return the filtered "ongoing" car parking information
  res.json({
    carParking: userWithParkingHistory.parking_history.map((carParking) =>
      carParking.toObject({ getters: true })
    ),
  });
};

// Get Car Parking status by User Id
const checkCarParkingStatus = async (req, res, next) => {
  // Validate the error
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { license_plate, brand, color } = req.body; // Assuming these details are sent in the request body

  let carParkingWithVehicle;

  try {
    // Find the vehicle based on the license plate, brand, and color
    const vehicle = await Vehicle.findOne({
      license_plate,
      brand,
      color,
    });

    if (!vehicle) {
      return next(new HttpError("Vehicle not found", 404));
    }

    // Find car parking associated with the vehicle
    carParkingWithVehicle = await Car_Parking.findOne({
      vehicle: vehicle._id,
      status: "ongoing", // Only check for ongoing car parking
    });

    if (!carParkingWithVehicle) {
      // return next(
      //   new HttpError("No ongoing car parking found for this vehicle", 404)
      // );
      return res.status(200).json({ message: "No ongoing car parking found" });
    }
  } catch (e) {
    console.error("Error fetching car parking:", e);
    return next(
      new HttpError("Fetching car parking data failed, please try again", 500)
    );
  }

  // Return the parking duration and other details
  res.status(200).json({
    carParking: carParkingWithVehicle.toObject({ getters: true }),
  });
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
  const { starting_time, duration, local_authority, vehicle, creator, price } =
    req.body;

  // Ensure starting_time is converted to a Date object in UTC
  const startTime = new Date(starting_time);
  if (isNaN(startTime.getTime())) {
    return next(new HttpError("Invalid starting time format", 422));
  }

  // Set the startTime to UTC explicitly (just as a best practice)
  // const startTimeUtc = new Date(startTime.toISOString());
  // Adjust starting time to Malaysia Time (UTC+8)
  const startTimeMYT = new Date(startTime.getTime() + 8 * 60 * 60 * 1000);

  // Calculate the end time by adding the duration in minutes, keeping it in UTC
  // const end_time = new Date(startTimeUtc.getTime() + duration * 60 * 1000);
  const end_time = new Date(startTimeMYT.getTime() + duration * 60 * 1000);

  // Create Car Parking
  const createdCarParking = new Car_Parking({
    starting_time: startTimeMYT,
    end_time: end_time.toISOString(), // Ensure end_time is also in UTC
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

  if (user.wallet > price) {
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

      res.status(201).json({ Car_Parking: createdCarParking });
    } catch (e) {
      console.error("Error during transaction:", e);
      return next(new HttpError("Creation failed, please try again", 500));
    }
  } else {
    return next(new HttpError("Insufficient balance", 403));
  }
};

// Extend the Car Parking
const extendCarParking = async (req, res, next) => {
  // Validate the input errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const carParkingId = req.params.cpid;
  const { duration, price } = req.body;

  let carParking, creator;

  const sess = await mongoose.startSession();
  sess.startTransaction();

  try {
    // Find the car parking entry by ID
    carParking = await Car_Parking.findById(carParkingId)
      .populate("creator")
      .session(sess);

    if (!carParking) {
      return next(new HttpError("Car Parking entry not found!", 404));
    }

    // Get the creator from the populated carParking
    creator = carParking.creator;

    if (!creator || creator.wallet < price) {
      return next(new HttpError("Insufficient wallet balance.", 400));
    }

    // Calculate the new end time based on the existing end_time
    const currentEndTime = new Date(carParking.end_time);
    const newEndTime = new Date(
      currentEndTime.getTime() + duration * 60 * 1000
    ); // Add duration in milliseconds

    // Update the car parking details
    carParking.duration += duration;
    carParking.end_time = newEndTime;

    // Save both carParking and creator
    await carParking.save({ session: sess });
    await creator.save({ session: sess });

    await sess.commitTransaction();
    sess.endSession();

    res
      .status(200)
      .json({ carParking: carParking.toObject({ getters: true }) });
  } catch (e) {
    await sess.abortTransaction();
    sess.endSession();
    console.error("Transaction error:", e);
    return next(
      new HttpError("Something went wrong, could not extend parking.", 500)
    );
  }
};

// Terminate the Car Parking
const terminateCarParking = async (req, res, next) => {
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

  const carParkingId = req.params.cpid;

  let carParking;

  try {
    // Find the car parking entry by ID
    carParking = await Car_Parking.findById(carParkingId);
  } catch (e) {
    const error = new HttpError("Not Found !", 404);

    return next(error);
  }

  // Update The new item
  carParking.status = "complete";

  try {
    // Update the data
    await carParking.save();
  } catch (e) {
    const error = new HttpError(
      "Something went wrong, could not update duration.",
      500
    );

    return next(error);
  }

  res.status(200).json({ carParking: carParking.toObject({ getters: true }) });
};

const sendSMS = async (req, res, next) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = require("twilio")(accountSid, authToken);

  const { message } = req.body;
  const userId = req.params.uid;

  let userWithParkingHistory;
  try {
    // Find the user by ID and populate the parking history
    userWithParkingHistory = await User.findById(userId).populate({
      path: "parking_history",
      match: { status: "ongoing" }, // Filter only "ongoing" car parking
    });

    if (!userWithParkingHistory) {
      return next(new HttpError("User not found", 404));
    }

    // Check if there's any ongoing parking
    if (userWithParkingHistory.parking_history.length === 0) {
      return next(new HttpError("No ongoing parking found for this user", 404));
    }
  } catch (e) {
    console.error("Error fetching car parking history:", e);
    return next(
      new HttpError("Fetching car parking data failed, please try again", 500)
    );
  }

  // Send SMS to the user's phone number if there is an ongoing parking
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `${userWithParkingHistory.no_telephone}`, // Add "+" to format as an international number
    });

    res.status(200).json({ message: "SMS sent successfully" });
  } catch (e) {
    console.error("Error sending SMS:", e);
    return next(new HttpError("Failed to send SMS, please try again", 500));
  }
};

// Export the Function
exports.getCarParkingById = getCarParkingById;
exports.getCarParkingByUserId = getCarParkingByUserId;
exports.checkCarParkingStatus = checkCarParkingStatus;
exports.createCarParking = createCarParking;
exports.extendCarParking = extendCarParking;
exports.terminateCarParking = terminateCarParking;
exports.sendSMS = sendSMS;
