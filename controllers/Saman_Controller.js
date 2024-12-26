const { validationResult } = require("express-validator");

// Import Model
const Saman = require("../models/Saman");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const Local_Auhtority = require("../models/Local_Authority");
const HttpError = require("../models/Http_Error");

const mongoose = require("mongoose");

const getSamanById = async (req, res, next) => {
  const samanId = req.params.sid;

  let saman;

  try {
    saman = await Saman.findById(samanId);
  } catch (e) {
    const error = new HttpError("Fetching Fail", 404);
    return next(error);
  }

  if (!saman) {
    const error = new HttpError("Saman not found", 404);
    return next(error);
  }

  return res.json({ saman: saman.toObject({ getters: true }) });
};

const getSamanHistoryByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let userWithVehicleSamanHistory;

  try {
    // Find the user by ID and populate their vehicles with saman_history and local authority nickname
    userWithVehicleSamanHistory = await User.findById(userId).populate({
      path: "vehicles",
      populate: {
        path: "saman_history",
        populate: {
          path: "local_authority", // Populate the local_authority field within saman
          select: "nickname", // Include only the nickname of the local authority
        },
        select: "offense date price status local_authority",
      },
    });

    if (!userWithVehicleSamanHistory) {
      return next(new HttpError("User not found", 404));
    }
  } catch (e) {
    console.error("Error fetching vehicle saman history:", e);
    return next(
      new HttpError("Fetching saman history failed, please try again", 500)
    );
  }

  // Check if the user has any vehicles
  if (
    !userWithVehicleSamanHistory.vehicles ||
    userWithVehicleSamanHistory.vehicles.length === 0
  ) {
    return res.json({ message: "No vehicles or saman history found" });
  }

  // Build the response to include vehicle and saman details with local authority nickname
  const response = userWithVehicleSamanHistory.vehicles.map((vehicle) => ({
    vehicleId: vehicle._id,
    license_plate: vehicle.license_plate,
    brand: vehicle.brand,
    color: vehicle.color,
    saman_history: vehicle.saman_history.map((saman) => ({
      ...saman.toObject({ getters: true }),
      local_authority: saman.local_authority
        ? saman.local_authority.nickname
        : "Unknown", // Show nickname if available, otherwise fallback to "Unknown"
    })),
  }));

  res.json({ vehicles: response });
};

const getGivenSamanByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithGivenSaman;

  try {
    // Find the user by id and populate the given saman
    userWithGivenSaman = await User.findById(userId).populate("given_saman");

    if (!userWithGivenSaman) {
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

  res.json({
    saman: userWithGivenSaman.given_saman.map((saman) =>
      saman.toObject({ getters: true })
    ),
  });
};

const createSaman = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { offense, license_plate, creator, local_authority } = req.body;

  let localAuthority;

  try {
    // Find the vehicle and user by their respective identifiers
    const [vehicle, user] = await Promise.all([
      Vehicle.findOne({ license_plate }),
      User.findById(creator),
    ]);

    localAuthority = await Local_Auhtority.findById(local_authority);

    if (!vehicle) {
      return next(new HttpError("Vehicle not found", 404));
    }

    if (!user) {
      return next(new HttpError("User not found", 404));
    }

    // Adjust starting time to Malaysia Time (UTC+8)
    const startTimeMYT = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);

    // Create the saman document
    const createdSaman = new Saman({
      offense,
      local_authority: localAuthority, // Hardcoded as an example; consider dynamic input
      date: startTimeMYT,
      price: 30, // Example: Default saman price
      vehicle: vehicle._id,
      creator,
    });

    const sess = await mongoose.startSession();
    sess.startTransaction();

    try {
      // Save the saman
      await createdSaman.save({ session: sess });

      // Update user's saman history and deduct wallet balance
      user.given_saman.push(createdSaman._id);

      // Update vehicle's saman history
      vehicle.saman_history.push(createdSaman._id);

      // Save updated entities
      await Promise.all([
        user.save({ session: sess }),
        vehicle.save({ session: sess }),
      ]);

      // Commit transaction
      await sess.commitTransaction();
      sess.endSession();

      return res.status(201).json({ saman: createdSaman });
    } catch (transactionError) {
      await sess.abortTransaction();
      sess.endSession();
      console.error("Transaction failed:", transactionError);
      throw transactionError;
    }
  } catch (e) {
    console.error("Error creating saman:", e);
    return next(new HttpError("Failed to create saman, please try again", 500));
  }
};

const paidSaman = async (req, res, next) => {
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

  const sid = req.params.sid;

  let saman;

  try {
    // Find the saman by id
    saman = await Saman.findById(sid);
  } catch (e) {
    const error = new HttpError("Not Found !", 404);

    return next(error);
  }

  saman.status = "paid";

  try {
    // Update the saman status
    await saman.save();
  } catch (e) {
    const error = new HttpError(
      "Something went wrong, could not update duration.",
      500
    );
    return next(error);
  }

  res.status(200).json({ saman: saman.toObject({ getters: true }) });
};

// Export the Function
exports.getSamanById = getSamanById;
exports.getSamanHistoryByUserId = getSamanHistoryByUserId;
exports.getGivenSamanByUserId = getGivenSamanByUserId;
exports.createSaman = createSaman;
exports.paidSaman = paidSaman;
