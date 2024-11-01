const express = require("express");

const { check } = require("express-validator");

const car_parking_controller = require("../controllers/Car_Parking_Controller");

const router = express.Router();

router.post(
  "/create",
  [
    check("starting_time").not().isEmpty(),
    check("end_time").not().isEmpty(),
    check("duration").not().isEmpty(),
    check("local_authority").not().isEmpty(),
    check("vehicle").not().isEmpty(),
  ],
  car_parking_controller.createCarParking
);

module.exports = router;
