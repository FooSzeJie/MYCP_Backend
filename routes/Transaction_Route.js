const express = require("express");

const transaction_controller = require("../controllers/Transaction_Controller");

const router = express.Router();

router.get("/:uid/list", transaction_controller.getTransactionByUserId);

router.get("/:tid/detail", transaction_controller.getTransactionById);

router.post("/:uid/paypal", transaction_controller.createTopUpTransaction);

router.post("/:uid/paypal/capture", transaction_controller.capturePayment);

module.exports = router;
