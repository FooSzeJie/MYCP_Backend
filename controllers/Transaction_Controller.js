// File: controllers/Transaction_Controller.js
const { validationResult } = require("express-validator");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const HttpError = require("../models/Http_Error");
const paypal = require("@paypal/checkout-server-sdk");
const mongoose = require("mongoose");
const { DateTime } = require("luxon");

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

      // Get the current date and time in Malaysia
      const malaysiaTime = DateTime.now().setZone("Asia/Kuala_Lumpur").toISO(); // Convert to ISO format for MongoDB compatibility

      const createdTransaction = new Transaction({
        name: "Top Up",
        money: money,
        date: malaysiaTime,
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
  // Validate the inputs
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { name, money, date, deliver, creator } = req.body;

  // Create a new parking transaction
  const createdParkingTransaction = new Transaction({
    name,
    money,
    date,
    deliver,
    status: "out", // Fixed syntax for status assignment
    creator,
  });

  let user;

  try {
    // Find the user by ID
    user = await User.findById(creator);
  } catch (e) {
    return next(
      new HttpError(
        "Creating Parking Transaction failed, please try again",
        500
      )
    );
  }

  if (!user) {
    return next(new HttpError("User not found", 404));
  }

  // Deduct money from the user's wallet
  if (user.wallet < money) {
    return next(new HttpError("Insufficient funds in wallet", 400));
  }

  user.wallet -= money;

  try {
    // Start a session and transaction
    const sess = await mongoose.startSession();
    sess.startTransaction();

    // Save the new transaction
    await createdParkingTransaction.save({ session: sess });

    // Add the transaction to the user's transaction history
    user.transaction_history.push(createdParkingTransaction._id);

    // Save the user with the updated wallet and transaction history
    await user.save({ session: sess });

    // Commit the transaction
    await sess.commitTransaction();
    sess.endSession();
  } catch (e) {
    return next(
      new HttpError("Transaction creation failed, please try again", 500)
    );
  }

  res.status(201).json({ transaction: createdParkingTransaction });
};

const createSamanTransaction = async (req, res, next) => {
  // Validate the inputs
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { name, money, date, deliver, creator } = req.body;

  // Create a new parking transaction
  const createdSamanTransaction = new Transaction({
    name,
    money,
    date,
    deliver,
    status: "out", // Fixed syntax for status assignment
    creator,
  });

  let user;

  try {
    // Find the user by ID
    user = await User.findById(creator);
  } catch (e) {
    return next(
      new HttpError(
        "Creating Parking Transaction failed, please try again",
        500
      )
    );
  }

  if (!user) {
    return next(new HttpError("User not found", 404));
  }

  // Deduct money from the user's wallet
  if (user.wallet < money) {
    return next(new HttpError("Insufficient funds in wallet", 400));
  }

  user.wallet -= money;

  try {
    // Start a session and transaction
    const sess = await mongoose.startSession();
    sess.startTransaction();

    // Save the new transaction
    await createdSamanTransaction.save({ session: sess });

    // Add the transaction to the user's transaction history
    user.transaction_history.push(createdSamanTransaction._id);

    // Save the user with the updated wallet and transaction history
    await user.save({ session: sess });

    // Commit the transaction
    await sess.commitTransaction();
    sess.endSession();
  } catch (e) {
    return next(
      new HttpError("Transaction creation failed, please try again", 500)
    );
  }

  res.status(201).json({ transaction: createdSamanTransaction });
};

const getTransactionByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  const { start_date, end_date } = req.query;

  let dateFilter = {};
  if (start_date) {
    dateFilter.$gte = new Date(start_date); // Start from the beginning of the day
  }
  if (end_date) {
    const endDate = new Date(end_date);
    endDate.setUTCHours(23, 59, 59, 999); // Extend to the end of the day
    dateFilter.$lte = endDate;
  }

  let userWithTransaction;

  try {
    userWithTransaction = await User.findById(userId).populate({
      path: "transaction_history",
      match: {
        ...(start_date || end_date ? { date: dateFilter } : {}),
      },
      options: { sort: { date: -1 } }, // Sort transactions in descending order
    });
  } catch (e) {
    console.error("Error fetching user:", e);
    return next(new HttpError("Fetching Fail", 404));
  }

  if (!userWithTransaction) {
    return next(new HttpError("The user hasn't made any transactions", 500));
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
exports.createSamanTransaction = createSamanTransaction;
exports.getTransactionByUserId = getTransactionByUserId;
exports.getTransactionById = getTransactionById;
