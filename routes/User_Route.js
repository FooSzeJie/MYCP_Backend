const express = require("express");

const { check } = require("express-validator");

const user_controller = require("../controllers/User_Controller");

const router = express.Router();

router.post(
  "/register",
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(), // Test@gmail.com => test@gmail.com
    check("password").isLength({ min: 6 }),
    check("no_telephone")
      .isNumeric()
      .withMessage("Telephone number must be numeric")
      .isLength({ min: 10, max: 15 })
      .withMessage("Telephone number must be between 10 and 15 digits"),
  ],

  user_controller.register
);

router.post("/login", user_controller.login);

// Export the function
module.exports = router;
