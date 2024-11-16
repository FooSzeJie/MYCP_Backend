const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  money: {
    type: String,
    required: true,
    get: (v) => v / 100,
    set: (v) => Math.round(v * 100),
  },

  date: { type: Date, required: true }, // Use Date type for timestamps

  status: {
    type: String,
    required: true,
    enum: ["in", "out"],
    default: "in", // Set a valid default value within the enum
  },

  deliver: {
    type: String,
    required: true,
    default: "Self",
  },

  creator: { type: mongoose.Types.ObjectId, require: true, ref: "User" },
});

// Use the uniqueValidator plugin to enforce uniqueness constraints
transactionSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Transaction", transactionSchema);
