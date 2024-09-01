const jwt = require("jsonwebtoken");

const HttpError = require("../models/Http_Error");

module.exports = (req, res, next) => {
  // when the system show the option in request method will auto agree
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const token = req.headers.authorization.split(" ")[1]; // Authorization: 'Bearer TOKEN'

    if (!token) {
      throw new Error("Authentication Failed!");
    }

    // (the token, "the system generate token by user login or register")
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);

    req.userData = { userId: decodedToken.userId };

    next();
  } catch (e) {
    const error = new HttpError("Authentication Failed!");
    return next(error);
  }
};
