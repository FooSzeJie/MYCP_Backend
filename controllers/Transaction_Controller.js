const { validationResult } = require("express-validator");

// Import Model
const User = require("../models/User");
const Car_Parking = require("../models/Car_Parking");
const HttpError = require("../models/Http_Error");

// Stripe
const Stripe = require("stripe");

const mongoose = require("mongoose");

// Create the transaction
const createTopUpTransaction = async (req, res, next) => {
  // Validate the error
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  //   User Id
  const userId = req.params.uid;

  
};

// Export the Function
exports.createTopUpTransaction = createTopUpTransaction;
