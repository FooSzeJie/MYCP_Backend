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
      .isLength({ min: 9, max: 12 })
      .withMessage("Telephone number must be between 10 and 15 digits"),
  ],

  user_controller.register
);

router.post("/login", user_controller.login);

router.get("/list", user_controller.showUser);

router.get("/:uid/profile", user_controller.getUserId);

router.patch(
  "/:uid/profile/update",
  [
    check("name").not().isEmpty(),
    check("no_telephone")
      .isNumeric()
      .withMessage("Telephone number must be numeric")
      .isLength({ min: 9, max: 12 })
      .withMessage("Telephone number must be between 10 and 15 digits"),
  ],
  user_controller.updateProfile
);

// Export the function
module.exports = router;
