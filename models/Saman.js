const mongoose = require("mongoose");

const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const samanSchema = new Schema({
  name: { type: String, required: true },

  date: { type: Date, required: true },

  price: {
    type: Number,
    required: true,
    get: (v) => v / 100,
    set: (v) => Math.round(v * 100),
    default: 50,
  },

  vehicle: { type: mongoose.Types.ObjectId, require: true, ref: "Vehicle" },
  // vehicle: { type: String, require: true },

  creator: { type: mongoose.Types.ObjectId, require: true, ref: "User" },

  status: {
    type: String,
    required: true,
    enum: ["unpaid", "paid"],
    default: "unpaid",
  },
});

module.exports = mongoose.model("Saman", samanSchema);
