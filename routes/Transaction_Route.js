const express = require("express");

const { check } = require("express-validator");

const transaction_controller = require("../controllers/Transaction_Controller");

const router = express.Router();

router.post("/top_ups", transaction_controller.createTopUpTransaction);

// Exports as router
module.exports = router;
