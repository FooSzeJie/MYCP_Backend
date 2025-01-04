const express = require("express");

const transaction_controller = require("../controllers/Transaction_Controller");

const router = express.Router();

router.get("/daily_income", transaction_controller.getDailyIncome);

router.get("/:uid/list", transaction_controller.getTransactionByUserId);

router.get("/:tid/detail", transaction_controller.getTransactionById);

router.post("/:uid/paypal", transaction_controller.createTopUpTransaction);

router.post("/:uid/paypal/capture", transaction_controller.capturePayment);

router.post(
  "/:uid/paypal/local_authority",
  transaction_controller.createPayLocalAuthorityTransaction
);

// router.post("/:uid/paypal/local_authority/capture", transaction_controller.createParkingTransaction);

router.post("/create", transaction_controller.createParkingTransaction);

router.post("/create/saman", transaction_controller.createSamanTransaction);

module.exports = router;
