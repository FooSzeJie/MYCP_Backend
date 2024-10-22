const { v4: uuidv4 } = require("uuid");

const { validationResult } = require("express-validator");

// Hash the Password
const bcrypt = require("bcryptjs");

// Use Token
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
    userId: createdUser.id,
    user: createdUser.name,
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

// Get all Users
const showUser = async (req, res, next) => {
  let userList;

  try {
    userList = await User.find();
  } catch (e) {
    const error = new HttpError("Fetching Fail", 404);
    return next(error);
  }

  if (!userList || userList.length === 0) {
    const error = new HttpError("No user found", 500);
    return next(error);
  }

  res.json({
    users: userList.map((user) => user.toObject({ getter: true })),
  });
};

// Get Users with Id
const getUserById = async (req, res, next) => {
  const userId = req.params.uid; // {pid: 'p1'}

  let user;

  try {
    // find the item by id
    user = await User.findById(userId);
  } catch (e) {
    const error = new HttpError(
      "Something went wrong, The user is not found",
      500
    );

    throw error;
  }

  if (!user) {
    const error = new HttpError(
      "Could not find a user for the provided id ",
      404
    );

    // Return error code
    return next(error);
  }

  // show the item without id have underscore
  return res.json({ user: user.toObject({ getters: true }) }); 
};

// Update the Users with id
const updateProfile = async (req, res, next) => {
  // Check the input data
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    throw new HttpError("Invalid inputs passed, please check your data", 422);
  }

  const { name, no_telephone } = req.body;

  const userId = req.params.uid;

  let user;

  try {
    // find the user by id
    user = await User.findById(userId);
  } catch (e) {
    const errors = HttpError(
      "Something went wrong, could not update User",
      500
    );

    return next(errors);
  }

  // if (user.role.toString() !== "admin") {
  //   const error = new HttpError(
  //     "You are not authorized to update this user",
  //     401
  //   );

  //   return next(error);
  // }

  user.name = name;
  user.no_telephone = no_telephone;

  try {
    // Update the user
    await user.save();
  } catch (e) {
    const error = new HttpError(
      "Something went wrong, could not update place",
      500
    );

    return next(errors);
  }

  // Show the result
  res.status(200).json({ user: user.toObject({ getters: true }) });
};

// export the function
exports.register = register;
exports.login = login;
exports.showUser = showUser;
exports.getUserId = getUserById;
exports.updateProfile = updateProfile;
