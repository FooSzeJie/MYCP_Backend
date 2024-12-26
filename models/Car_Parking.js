const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const carParkingSchema = new Schema({
  starting_time: { type: Date, required: true }, // Use Date type for timestamps
  end_time: { type: Date, required: true }, // Use Date type for timestamps
  duration: { type: Number, required: true },
  local_authority: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Local_Authority",
  },
  vehicle: { type: mongoose.Types.ObjectId, required: true, ref: "Vehicle" },
  status: {
    type: String,
    required: true,
    enum: ["complete", "ongoing"],
    default: "ongoing", // Set a valid default value within the enum
  },
  creator: { type: mongoose.Types.ObjectId, require: true, ref: "User" },
});

// Use the uniqueValidator plugin to enforce uniqueness constraints
carParkingSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Car_Parking", carParkingSchema);
