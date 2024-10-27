const { validationResult } = require("express-validator");

// Import Model
const User = require("../models/user");
const Local_Authority = require("../models/Local_Authority");
const HttpError = require("../models/Http_Error");

const mongoose = require("mongoose");

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

const editLocalAuthority = async (req, res, next) => {};

// Export the Function
exports.createLocalAuthority = createLocalAuthority;
exports.editLocalAuthority = editLocalAuthority;
