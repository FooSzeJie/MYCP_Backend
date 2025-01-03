const mongoose = require("mongoose");

const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const localAuthoritySchema = new Schema({
  name: { type: String, required: true },
  nickname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  no_telephone: { type: Number, required: true, unique: true },
  income: {
    type: Number,
    default: 0,
    get: (v) => v / 100,
    set: (v) => Math.round(v * 100),
  },
  total_income: {
    type: Number,
    default: 0,
    get: (v) => v / 100,
    set: (v) => Math.round(v * 100),
  },
  area: { type: String, required: true },
  state: { type: String, required: true },
  car_parking: [
    { type: mongoose.Types.ObjectId, required: true, ref: "Car_Parking" },
  ],
  saman: [{ type: mongoose.Types.ObjectId, required: true, ref: "Saman" }],
});

// Use the Validator function
localAuthoritySchema.plugin(uniqueValidator);

module.exports = mongoose.model("Local_Authority", localAuthoritySchema);
