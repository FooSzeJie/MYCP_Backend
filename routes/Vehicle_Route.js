const express = require("express");

const { check } = require("express-validator");

const vehicle_controller = require("../controllers/Vehicle_Controller");

const checkAuth = require("../middlewares/Check_Auth");

const router = express.Router();

router.get("/user/:uid", vehicle_controller.getVehicleByUserId);

router.get("/:vid", vehicle_controller.getVehicleById);

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

router.patch(
  "/:vid/update",
  [
    check("license_plate").not().isEmpty(),
    check("brand").not().isEmpty(),
    check("color").not().isEmpty(),
  ],
  vehicle_controller.updateVehicleById
);

router.delete("/:vid/delete", vehicle_controller.deleteVehicleById);

// Export the Function
module.exports = router;
