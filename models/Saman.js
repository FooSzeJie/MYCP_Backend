const mongoose = require("mongoose");

const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const samanSchema = new Schema({
  offense: { type: String, required: true },

  date: { type: Date, required: true },

  price: {
    type: Number,
    required: true,
    get: (v) => v / 100,
    set: (v) => Math.round(v * 100),
    default: 30,
  },

  vehicle: { type: mongoose.Types.ObjectId, require: true, ref: "Vehicle" },
  // vehicle: { type: String, require: true },

  creator: { type: mongoose.Types.ObjectId, require: true, ref: "User" },

  local_authority: {
    type: mongoose.Types.ObjectId,
    // type: String,
    require: true,
    ref: "Local_Authority",
  },

  status: {
    type: String,
    required: true,
    enum: ["unpaid", "paid"],
    default: "unpaid",
  },
});

module.exports = mongoose.model("Saman", samanSchema);
