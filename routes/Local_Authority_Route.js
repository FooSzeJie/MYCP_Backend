const express = require("express");

const { check } = require("express-validator");

const local_Authority_controller = require("../controllers/Local_Authority_Controller");

const router = express.Router();

router.get("/list", local_Authority_controller.getLocalAuthority);

router.get("/:laid/profile", local_Authority_controller.getLocalAuthorityById);

router.post(
  "/create",
  [
    check("name").not().isEmpty(),
    check("nickname").not().isEmpty(),
    check("email").normalizeEmail().isEmail(), // Test@gmail.com => test@gmail.com
    check("no_telephone")
      .isNumeric()
      .withMessage("Telephone number must be numeric")
      .isLength({ min: 9, max: 12 })
      .withMessage("Telephone number must be between 10 and 15 digits"),
    check("area").not().isEmpty(),
    check("state").not().isEmpty(),
  ],
  local_Authority_controller.createLocalAuthority
);

router.patch(
  "/:laid/update",
  [
    check("name").not().isEmpty(),
    check("nickname").not().isEmpty(),
    check("email").normalizeEmail().isEmail(), // Test@gmail.com => test@gmail.com
    check("no_telephone")
      .isNumeric()
      .withMessage("Telephone number must be numeric")
      .isLength({ min: 9, max: 12 })
      .withMessage("Telephone number must be between 10 and 15 digits"),
    check("area").not().isEmpty(),
    check("state").not().isEmpty(),
  ],
  local_Authority_controller.updateLocalAuthority
);

router.delete("/:laid/delete", local_Authority_controller.deleteLocalAuthority);

module.exports = router;
