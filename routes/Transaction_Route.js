const express = require("express");

const transaction_controller = require("../controllers/Transaction_Controller");

const router = express.Router();

router.post("/:uid/paypal", transaction_controller.createTopUpTransaction);

router.post("/:uid/paypal/capture", transaction_controller.capturePayment);

module.exports = router;
