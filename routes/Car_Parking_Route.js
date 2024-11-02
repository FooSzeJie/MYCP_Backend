const express = require("express");

const { check } = require("express-validator");

const car_parking_controller = require("../controllers/Car_Parking_Controller");

const router = express.Router();

router.get("/:cpid", car_parking_controller.getCarParkingById);

router.post(
  "/create",
  [
    check("starting_time").not().isEmpty(),
    check("duration").not().isEmpty(),
    check("local_authority").not().isEmpty(),
    check("vehicle").not().isEmpty(),
    check("creator").not().isEmpty(),
  ],
  car_parking_controller.createCarParking
);

router.patch(
  "/:cpid/extend",
  [check("duration").not().isEmpty()],
  car_parking_controller.extendCarParking
);

router.patch(
  "/:cpid/terminate",
  car_parking_controller.terminateCarParking
);

module.exports = router;
