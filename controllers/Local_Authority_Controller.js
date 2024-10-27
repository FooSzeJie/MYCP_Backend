const { validationResult } = require("express-validator");

// Import Model
const User = require("../models/user");
const Local_Authority = require("../models/Local_Authority");
const HttpError = require("../models/Http_Error");

const mongoose = require("mongoose");

// Admin Login Function
const login = async (req, res, next) => {
  const { email, password } = req.body;

  //   Check the account whether exist
  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (e) {
    const error = new HttpError("Logging Fail, please try later", 500);

    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("Logging Fail, Cannot login your account", 403);

    return next(error);
  }

  // Check if the user is an admin
  if (existingUser.role !== "admin") {
    const error = new HttpError("Access denied, only admins can log in", 403);

    return next(error);
  }

  // Check the password whether correct
  let isValidPassword = false;

  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (e) {
    const error = new HttpError(
      "Could not log you in, please check your credentials and try again.",
      500
    );

    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError("Logging Fail, Cannot login your account", 403);

    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email }, // What content make to token
      process.env.JWT_KEY, // The Session Name
      { expiresIn: "1h" } // The session expired time
    );
  } catch (e) {
    const error = new HttpError("Logging Fail, please try again", 500);

    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};

// Export the Function
exports.login = login;
