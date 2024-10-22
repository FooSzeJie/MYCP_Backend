const express = require("express");

const { check } = require("express-validator");

const vehicle_controller = require("../controllers/Vehicle_Controller");

const checkAuth = require("../middlewares/Check_Auth");

const router = express.Router();

// Under this function will need to login first
// router.use(checkAuth);

router.post(
  "/create",
  [
    check("license_plate").not().isEmpty(),
    check("brand").not().isEmpty(),
    check("color").not().isEmpty(),
  ],
  vehicle_controller.createVehicle
);

// Export the Function
module.exports = router;
