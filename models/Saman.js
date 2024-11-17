const mongoose = require("mongoose");

const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const samanSchema = new Schema({
  name: { type: String, required: true },

  date: { type: Date, required: true },

  vehicle: { type: mongoose.Types.ObjectId, require: true, ref: "Vehicle" },

  creator: { type: mongoose.Types.ObjectId, require: true, ref: "User" },
});

module.exports = mongoose.model("Saman", samanSchema);
