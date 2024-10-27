const { validationResult } = require("express-validator");

// Import Model
const User = require("../models/user");
const Local_Authority = require("../models/Local_Authority");
const HttpError = require("../models/Http_Error");

const mongoose = require("mongoose");

// Admin Login Function
const login = async (req, res, next) => {};

// Export the Function
exports.login = login;
