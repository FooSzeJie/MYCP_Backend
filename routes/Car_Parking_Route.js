const express = require("express");

const { check } = require("express-validator");

const car_parking_controller = require("../controllers/Car_Parking_Controller");

const router = express.Router();

router.get("/:cpid/detail", car_parking_controller.getCarParkingById);

router.get("/:uid/status", car_parking_controller.getCarParkingByUserId);

router.get(
  "/:uid/parking_history",
  car_parking_controller.getParkingHistoryByUserId
);

router.post(
  "/check_status",
  [
    check("license_plate").not().isEmpty(),
    check("brand").not().isEmpty(),
    check("color").not().isEmpty(),
  ],
  car_parking_controller.checkCarParkingStatus
);

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

router.patch("/:cpid/terminate", car_parking_controller.terminateCarParking);

router.post("/:uid/SMS", car_parking_controller.sendSMS);

module.exports = router;
