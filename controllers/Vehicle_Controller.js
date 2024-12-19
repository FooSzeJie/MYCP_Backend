const { validationResult } = require("express-validator");

// Import Model
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
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
  // Validate errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { license_plate, brand, color, creator } = req.body;

  let vehicle;
  let user;

  try {
    // Find a matching vehicle
    vehicle = await Vehicle.findOne({ license_plate, brand, color });
  } catch (e) {
    console.error("Error finding vehicle:", e);
    return next(
      new HttpError("Vehicle lookup failed, please try again later", 500)
    );
  }

  try {
    // Find the user
    user = await User.findById(creator);
    if (!user) {
      return next(new HttpError("User not available", 404));
    }
  } catch (e) {
    console.error("Error finding user:", e);
    return next(
      new HttpError("User lookup failed, please try again later", 500)
    );
  }

  const sess = await mongoose.startSession();
  sess.startTransaction();

  try {
    if (vehicle) {
      // Vehicle exists, associate it with the new user
      if (!user.vehicles.includes(vehicle._id)) {
        user.vehicles.push(vehicle._id);
        vehicle.creator.push(creator);
        await user.save({ session: sess });
        await vehicle.save({ session: sess });
      }
    } else {
      // Vehicle does not exist, create a new one
      const createdVehicle = new Vehicle({
        license_plate,
        brand,
        color,
        creator,
      });

      // Save the new vehicle
      await createdVehicle.save({ session: sess });

      // Add to user's vehicles
      user.vehicles.push(createdVehicle._id);
      await user.save({ session: sess });

      vehicle = createdVehicle;
    }

    // Commit the transaction
    await sess.commitTransaction();
    sess.endSession();
  } catch (e) {
    await sess.abortTransaction();
    console.error("Error during transaction:", e);
    return next(new HttpError("Failed to create or link vehicle", 500));
  }

  res.status(201).json({ vehicle });
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
  const vehicleId = req.params.vid;
  const userId = req.params.uid;

  let vehicle, user;

  try {
    vehicle = await Vehicle.findById(vehicleId);
    user = await User.findById(userId);

    if (!vehicle) {
      return next(new HttpError("Vehicle not found", 404));
    }

    if (!user) {
      return next(new HttpError("User not found", 404));
    }

    if (!vehicle.creator.includes(userId)) {
      return next(
        new HttpError("You are not authorized to delete this vehicle", 403)
      );
    }
  } catch (e) {
    return next(
      new HttpError("Something went wrong, could not process request", 500)
    );
  }

  let retryAttempts = 3;
  while (retryAttempts > 0) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Remove user from vehicle.creator array
      vehicle.creator.pull(userId);
      await vehicle.save({ session });

      // Remove vehicle ID from user.vehicles array
      user.vehicles.pull(vehicleId);
      await user.save({ session });

      await session.commitTransaction();
      session.endSession();

      // Break out of retry loop after successful transaction
      retryAttempts = 0;

      return res
        .status(200)
        .json({ message: "Vehicle unlinked from user successfully" });
    } catch (e) {
      await session.abortTransaction();
      session.endSession();

      console.error("Transaction error:", e);

      if (
        retryAttempts === 1 ||
        !e.errorLabels?.includes("TransientTransactionError")
      ) {
        return next(
          new HttpError("Failed to delete vehicle, please try again", 500)
        );
      }

      console.log("Retrying transaction...");
      retryAttempts--;
    }
  }
};

// Export the Function
exports.getVehicleByUserId = getVehicleByUserId;
exports.getVehicleById = getVehicleById;
exports.createVehicle = createVehicle;
exports.updateVehicleById = updateVehicleById;
exports.deleteVehicleById = deleteVehicleById;
