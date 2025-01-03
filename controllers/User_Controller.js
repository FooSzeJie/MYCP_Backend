const { v4: uuidv4 } = require("uuid");

const { validationResult } = require("express-validator");

// Hash the Password
const bcrypt = require("bcryptjs");

// Use Token
const jwt = require("jsonwebtoken");

// Import Model
const User = require("../models/User");
const HttpError = require("../models/Http_Error");

// Use Email Package
const nodemailer = require("nodemailer");

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

  // Determine role based on whether there are existing users
  let role; // Default role

  try {
    const userCount = await User.countDocuments(); // Check total user count

    if (userCount === 0) {
      role = "admin"; // Assign admin role to the first user
    }
  } catch (e) {
    const error = new HttpError("Register failed, please try again", 500);
    return next(error);
  }

  const createdUser = new User({
    // Ensure this matches the key in the request
    name,
    email,
    password: hashedPassword,
    no_telephone,
    role,
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
    const error = new HttpError("Register Failed, please try again", 500);
    return next(error);
  }

  res.status(201).json({
    userId: createdUser.id,
    user: createdUser.name,
    email: createdUser.email,
    token: token,
    phone: createdUser.no_telephone,
    role: createdUser.role,
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

// Admin Login Function
const adminLogin = async (req, res, next) => {
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

// Get Users with Id
const getUserDefaultVehicle = async (req, res, next) => {
  const userId = req.params.uid;

  let user;

  try {
    // Fetch user and populate the default_vehicle field
    user = await User.findById(userId).populate("default_vehicle");
  } catch (e) {
    const error = new HttpError(
      "Something went wrong, The user is not found",
      500
    );
    throw error;
  }

  if (!user) {
    const error = new HttpError(
      "Could not find a user for the provided id",
      404
    );
    return next(error);
  }

  // Return the user as a plain object with populated data
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

// Update the Users with id
const updateAdminProfile = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { name, no_telephone, role } = req.body; // Include `role` in the request body
  const userId = req.params.uid;

  let user;

  try {
    user = await User.findById(userId); // Find the user by ID
  } catch (e) {
    return next(
      new HttpError("Something went wrong, could not update the user", 500)
    );
  }

  if (!user) {
    return next(new HttpError("User not found", 404));
  }

  // Update user properties
  user.name = name;
  user.no_telephone = no_telephone;
  user.role = role; // Update role only if provided

  try {
    await user.save(); // Save changes
  } catch (e) {
    console.log(e);
    return next(new HttpError("Saving changes failed, please try again", 500));
  }

  res.status(200).json({ user: user.toObject({ getters: true }) });
};

// Send the Email
const sendEmail = async (req, res, next) => {
  // Check the input data
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    throw new HttpError("Invalid inputs passed, please check your data", 422);
  }

  const userId = req.params.uid;

  let user;

  try {
    user = await User.findById(userId);
  } catch (e) {
    const error = new HttpError("User not found", 404);

    return next(error);
  }

  if (!user) {
    return next(new HttpError("User not found", 404));
  }

  const { subject, message } = req.body;

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      // service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // true for port 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, // Store credentials in environment variables
        pass: process.env.EMAIL_PASSWORD,
      },
      // logger: true, // Enable logging to see more details
    });

    // Email details
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: subject,
      text: message,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // console.log("Email sent: " + info.response);

    res.status(200).json({ message: "Email sent successfully!" });
  } catch (e) {
    console.error("Error sending email:", e);

    return next(
      new HttpError("Something went wrong, could not send email", 500)
    );
  }
};

// export the function
exports.register = register;
exports.login = login;
exports.adminLogin = adminLogin;
exports.showUser = showUser;
exports.getUserId = getUserById;
exports.getUserDefaultVehicle = getUserDefaultVehicle;
exports.updateProfile = updateProfile;
exports.updateAdminProfile = updateAdminProfile;
exports.sendEmail = sendEmail;
