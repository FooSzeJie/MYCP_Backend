const { validationResult } = require("express-validator");

// Import Model
const User = require("../models/User");
const Car_Parking = require("../models/Car_Parking");
const HttpError = require("../models/Http_Error");

// Create the Car Parking
const createCarParking = async (req, res, next) => {};

// Export the Function
exports.createCarParking = createCarParking;
