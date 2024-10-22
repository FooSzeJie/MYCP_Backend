const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  no_telephone: { type: Number, required: true, unique: true },
  wallet: {
    type: Number,
    default: 0,
    get: (v) => v / 100, // Dividing the stored integer value by 100 to get the decimal amount
    set: (v) => Math.round(v * 100), // Multiplying input by 100 and rounding to avoid floating point precision issues
  },
  role: {
    type: String,
    enum: ["user", "admin", "traffic warden"],
    default: "user",
  },
  vehicles: [{ type: mongoose.Types.ObjectId, require: true, ref: "Vehicle" }], // get Id from the User Model in the mongodb
});

// Use the validator function
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
