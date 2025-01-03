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

router.post("/adminLogin", user_controller.adminLogin);

router.get("/list", user_controller.showUser);

router.get("/:uid/profile", user_controller.getUserId);

router.get("/:uid/default_vehicle", user_controller.getUserDefaultVehicle);

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

router.patch(
  "/:uid/admin/update",
  [
    check("name").not().isEmpty(),
    check("role").optional().isIn(["admin", "user", "traffic warden"]),
  ],
  user_controller.updateAdminProfile
);

router.post(
  "/:uid/send_email",
  [check("subject").not().isEmpty(), check("message").not().isEmpty()],
  user_controller.sendEmail
);

// Export the function
module.exports = router;
