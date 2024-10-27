const { validationResult } = require("express-validator");

// Import Model
// const User = require("../models/user");
const Local_Authority = require("../models/Local_Authority");
const HttpError = require("../models/Http_Error");

// const mongoose = require("mongoose");

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

const updateLocalAuthority = async (req, res, next) => {};

// Export the Function
exports.getLocalAuthority = getLocalAuthority;
exports.getLocalAuthorityById = getLocalAuthorityById;
exports.createLocalAuthority = createLocalAuthority;
exports.updateLocalAuthority = updateLocalAuthority;
