const { validationResult } = require("express-validator");

// Import Model
const Saman = require("../models/Saman");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const HttpError = require("../models/Http_Error");

const mongoose = require("mongoose");

const createSaman = async (req, res, next) => {};

// Export the Function
exports.createSaman = createSaman;
