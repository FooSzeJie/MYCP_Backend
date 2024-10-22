const { validationResult } = require("express-validator");

// Import Model
const Vehicle = require("../models/Vehicle");
const HttpError = require("../models/Http_Error");

const createVehicle = async (req, res, next) => {};

// Export the Function
exports.createVehicle = createVehicle;
