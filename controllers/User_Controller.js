const { v4: uuidv4 } = require("uuid");

const { validationResult } = require("express-validator");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

// Import Model
const User = require("../models/user");
const HttpError = require("../models/Http_Error");

// Register function
const register = async (req, res, next) => {
  const errors = validationResult(req);

  // Check for validation errors
  if (!errors.isEmpty()) {
    console.log(errors.array()); // Logs specific validation errors
    return next(new HttpError("Invalid Input", 422));
  }

  // Get the value from request body
  const { name, email, password, no_telephone } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (e) {
    const error = new HttpError("Register failed, please try later", 500);
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "User already exists, please check your email",
      422
    );
    return next(error);
  }

  let hashedPassword;

  // Hash the password
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (e) {
    const error = new HttpError("Could not create user, please try again", 500);
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    no_telephone, // Ensure this matches the key in the request
  });

  try {
    await createdUser.save();
  } catch (e) {
    const error = new HttpError("Register Failed 1, please try again", 500);
    console.error("Error saving user:", e);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY, // This is private key, only exists on server side
      { expiresIn: "1h" }
    );
  } catch (e) {
    const error = new HttpError("Register Failed 2, please try again", 500);
    return next(error);
  }

  res.status(201).json({
    user: createdUser.id,
    email: createdUser.email,
    token: token,
    phone: createdUser.no_telephone,
  });
};

// Sign in function
const login = async (req, res, next) => {
  const { email, password } = req.body;

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

// export the function
exports.register = register;
exports.login = login;
