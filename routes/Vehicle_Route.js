const express = require("express");

const { check } = require("express-validator");

const vehicle_controller = require("../controllers/Vehicle_Controller");

const router = express.Router();

router.post("/create", vehicle_controller.createVehicle);

// Export the Function
module.exports = router;
