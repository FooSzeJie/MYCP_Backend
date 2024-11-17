const mongoose = require("mongoose");

// unique Validator to check the data whether exist
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const vehicleSchema = new Schema({
  license_plate: { type: String, required: true },

  brand: { type: String, required: true },

  color: { type: String, required: true },

  creator: { type: mongoose.Types.ObjectId, require: true, ref: "User" },

  saman_history: [
    {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Saman",
    },
  ],
});

// Use the validator function
vehicleSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Vehicle", vehicleSchema);
