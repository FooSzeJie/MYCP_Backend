const mongoose = require("mongoose");

// unique Validator to check the data whether exist
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const vehicleSchema = new Schema({
  brand: { type: String, required: true },
  license_plate: { type: String, required: true },
  color: { type: String, required: true },
});

// Use the validator function
vehicleSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Vehicle", vehicleSchema);
