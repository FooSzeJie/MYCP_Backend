const { validationResult } = require("express-validator");

// Import Model
// const User = require("../models/user");
const Local_Authority = require("../models/Local_Authority");
const HttpError = require("../models/Http_Error");

// const mongoose = require("mongoose");

// Get All Local Authority Data
const getLocalAuthority = async (req, res, next) => {
  let localAuthorityList;

  try {
    localAuthorityList = await Local_Authority.find();
  } catch (e) {
    const error = new HttpError(
      "Fetching local authorities failed, please try again.",
      500
    );
  }

  if (!localAuthorityList || localAuthorityList.length === 0) {
    const error = new HttpError("No local authority found", 500);
    return next(error);
  }

  res.json({
    localAuthority: localAuthorityList.map((localAuthority) =>
      localAuthority.toObject({ getters: true })
    ),
  });
};

// Get Local Authority Data by ID
const getLocalAuthorityById = async (req, res, next) => {
  const localAuthorityId = req.params.laid;

  let localAuthority;

  try {
    localAuthority = await Local_Authority.findById(localAuthorityId);
  } catch (e) {
    const error = new HttpError(
      "Something went wrong, The user is not found",
      500
    );

    return next(error);
  }

  if (!localAuthority) {
    const error = new HttpError("Local authority not found", 404);

    return next(error);
  }

  //   Show the Item without id have underscore
  return res.json({
    localAuthority: localAuthority.toObject({ getters: true }),
  });
};

// Admin Login Function
const createLocalAuthority = async (req, res, next) => {
  // Validator the Error
  const errors = validationResult(req);

  // If having Error
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  //   Get the data from Frontend
  const { name, nickname, email, no_telephone, area, state } = req.body;

  // Create new user
  const createdLocalAuthority = new Local_Authority({
    name,
    nickname,
    email,
    no_telephone,
    area,
    state,
  });

  try {
    await createdLocalAuthority.save();
  } catch (e) {
    return next(
      new HttpError("Creating Local Authority failed, please try again", 500)
    );
  }

  res
    .status(201)
    .json({ localAuthority: "Local Authority created successfully" });
};

// Update Local Authority Data by ID
const updateLocalAuthority = async (req, res, next) => {
  // Validator the Error
  const errors = validationResult(req);

  // If having Error
  if (!errors.isEmpty()) {
    console.log(errors);

    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  //   Get Data from the Frontend
  const { name, nickname, email, no_telephone, area, state } = req.body;

  //   Get Local Authority ID
  const localAuthorityId = req.params.laid;

  let localAuthority;

  try {
    // Find the local AUthority by id
    localAuthority = await Local_Authority.findById(localAuthorityId);
  } catch (e) {
    return next(
      new HttpError(
        "Something went wrong, Could not update local authority, please try again",
        500
      )
    );
  }

  // Update fields if Local Authority exists
  //   Object.assign(localAuthority, { name, nickname, email, no_telephone, area, state });

  //   Replace the Data
  localAuthority.name = name;
  localAuthority.nickname = nickname;
  localAuthority.email = email;
  localAuthority.no_telephone = no_telephone;
  localAuthority.area = area;
  localAuthority.state = state;

  try {
    // Update the Local Authority
    await localAuthority.save();
  } catch (e) {
    return next(
      new HttpError(
        "Something went wrong, could not update local authority",
        500
      )
    );
  }

  res
    .status(200)
    .json({ localAuthority: localAuthority.toObject({ getters: true }) });
};

const deleteLocalAuthority = async (req, res, next) => {
  //   Get Local Authority ID
  const localAuthorityId = req.params.laid;

  let localAuthority;

  try {
    // Find the data By id
    localAuthority = await Local_Authority.findById(localAuthorityId);
  } catch (e) {
    return next(
      new HttpError(
        "Something went wrong, could not delete local authority, please try again",
        500
      )
    );
  }

  //   Check the Local Authority whether exist or not
  if (!localAuthority) {
    return next(new HttpError("Local Authority is not Found", 404));
  }

  try {
    // Delete the Local Authority
    await Local_Authority.findByIdAndDelete(localAuthorityId);
  } catch (e) {
    console.error("Error deleting Local Authority:", e);

    return next(
      new HttpError(
        "Something went wrong, could not delete local authority",
        500
      )
    );
  }

  res.status(200).json({ message: "Deleted Local Authority" });
};

const paidIncome = async (req, res, next) => {
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

  const localAuthorityId = req.params.laid;

  let localAuthority;

  try {
    localAuthority = await Local_Authority.findById(localAuthorityId);
  } catch (e) {
    return next(
      new HttpError("Something went wrong, could not find local authority", 500)
    );
  }

  localAuthority.income = 0;

  try {
    // Update the localAuthority income
    await localAuthority.save();
  } catch (e) {
    const error = new HttpError(
      "Something went wrong, could not update duration.",
      500
    );
    return next(error);
  }

  res
    .status(200)
    .json({ localAuthority: localAuthority.toObject({ getters: true }) });
};

// Export the Function
exports.getLocalAuthority = getLocalAuthority;
exports.getLocalAuthorityById = getLocalAuthorityById;
exports.createLocalAuthority = createLocalAuthority;
exports.updateLocalAuthority = updateLocalAuthority;
exports.deleteLocalAuthority = deleteLocalAuthority;
exports.paidIncome = paidIncome;
