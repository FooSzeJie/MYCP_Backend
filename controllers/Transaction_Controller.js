// File: controllers/Transaction_Controller.js
const { validationResult } = require("express-validator");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const HttpError = require("../models/Http_Error");
const paypal = require("@paypal/checkout-server-sdk");
const mongoose = require("mongoose");

const environment =
  process.env.NODE_ENV === "production"
    ? new paypal.core.LiveEnvironment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET
      )
    : new paypal.core.SandboxEnvironment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET
      );
const paypalClient = new paypal.core.PayPalHttpClient(environment);

const createTopUpTransaction = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { money } = req.body;
  const userId = req.params.uid;

  if (!money) {
    return next(new HttpError("Money is a required field", 400));
  }

  let user;
  try {
    user = await User.findById(userId);
    if (!user) {
      return next(new HttpError("User not found", 404));
    }
  } catch (e) {
    return next(
      new HttpError("Fetching user data failed, please try again", 500)
    );
  }

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "MYR",
          value: money.toString(),
        },
        description: `Top up for user ${user.name}`,
        custom_id: userId,
        shipping_preference: "NO_SHIPPING",
      },
    ],
    application_context: {
      return_url: `http://return_url/paypal-success`,
      cancel_url: `http://return_url/paypal-cancel`,
    },
  });

  try {
    const order = await paypalClient.execute(request);

    const approvalLink = order.result.links.find(
      (link) => link.rel === "approve"
    ).href;

    return res.status(201).json({
      orderID: order.result.id,
      approvalLink: approvalLink,
    });
  } catch (e) {
    console.error("PayPal order creation failed:", e);
    return next(
      new HttpError("PayPal order creation failed, please try again", 500)
    );
  }
};

const capturePayment = async (req, res, next) => {
  const { orderID } = req.body;
  const userId = req.params.uid;

  try {
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    const capture = await paypalClient.execute(request);

    // console.log("Capture result:", capture.result);

    if (capture.result.status === "COMPLETED") {
      // Access `amount.value` safely within `purchase_units[0].payments.captures`
      const purchaseUnit = capture.result.purchase_units[0];
      const captureDetail = purchaseUnit.payments?.captures?.[0];
      const amount = captureDetail?.amount?.value;

      if (!amount) {
        return next(
          new HttpError("Amount data is missing in the response", 500)
        );
      }

      const money = parseFloat(amount);
      let user = await User.findById(userId);

      if (!user) {
        return next(new HttpError("User not found", 404));
      }

      const createdTransaction = new Transaction({
        money: money,
        date: new Date(),
        creator: userId,
        status: "in",
      });

      user.wallet += money;

      const sess = await mongoose.startSession();
      sess.startTransaction();

      try {
        await createdTransaction.save({ session: sess });
        user.transaction_history.push(createdTransaction._id);
        await user.save({ session: sess });
        await sess.commitTransaction();
      } catch (err) {
        await sess.abortTransaction();
        return next(new HttpError("Transaction failed, please try again", 500));
      } finally {
        sess.endSession();
      }

      return res.json({
        success: true,
        transaction: createdTransaction,
      });
    } else {
      return res.json({ success: false, message: "Payment was not completed" });
    }
  } catch (e) {
    console.error("Capture error:", e);
    return next(new HttpError("Payment capture failed, please try again", 500));
  }
};

const createParkingTransaction = async (req, res, next) => {
  // Validator the Error
  const errors = validationResult(req);

  // if having error
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { money, date, deliver, creator } = req.body;

  const createdParkingTransaction = new Transaction({
    money,
    date,
    deliver,
    creator,
  });

  let user;

  try {
    user = await User.findById(creator);
  } catch (e) {
    return next(
      new HttpError("Creating Parking Transaction Fail, please try again", 500)
    );
  }

  if (!user) {
    return next(new HttpError("User Not Available", 404));
  }

  try {
    // Starting The Session
    const sess = await mongoose.startSession();

    // Starting The Transaction
    sess.startTransaction();

    // Store the data into db
    await createdParkingTransaction.save({ session: sess });

    // Push is one of the mongoose method to store the transaction id to use table transaction_history attribute
    user.transaction_history.push(createdParkingTransaction);

    // Store the data to the db by User model
    await user.save({ session: sess });

    // Submit the transition, only this step will update the db
    await sess.commitTransaction();
  } catch (e) {
    return next("Created Fail !", 500);
  }

  res.status(201).json({ transaction: createdParkingTransaction });
};

const getTransactionByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithTransaction;

  try {
    userWithTransaction = await User.findById(userId).populate(
      "transaction_history"
    );
  } catch (e) {
    console.error("Error fetching user:", e);
    return next(new HttpError("Fetching Fail", 404));
  }

  if (!userWithTransaction) {
    const error = new HttpError("The user haven't make any transaction", 500);

    return next(error);
  }

  res.json({
    transaction: userWithTransaction.transaction_history.map((transaction) =>
      transaction.toObject({ getters: true })
    ),
  });
};

const getTransactionById = async (req, res, next) => {
  const transactionId = req.params.tid;

  let transaction;

  try {
    transaction = await Transaction.findById(transactionId);
  } catch (e) {
    console.error("Error fetching transaction:", e);
    return next(new HttpError("Fetching Fail", 404));
  }

  if (!transaction) {
    return next(new HttpError("Transaction is not found", 404));
  }

  return res.json({ transaction: transaction.toObject({ getters: true }) });
};

exports.createTopUpTransaction = createTopUpTransaction;
exports.capturePayment = capturePayment;
exports.createParkingTransaction = createParkingTransaction;
exports.getTransactionByUserId = getTransactionByUserId;
exports.getTransactionById = getTransactionById;
