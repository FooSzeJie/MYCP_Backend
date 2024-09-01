const mongoose = require("mongoose");

// unique Validator to check the data whether exist
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, require: true, unique: true },
  password: { type: String, require: true, minlength: 6 },
  no_telephone: { type: Number, required: true, unique: true },
  wallet: {
    type: Number,
    required: true,
    default: 0.0,
    validate: {
      validator: function (value) {
        // Check if the value is a finite number with up to two decimal places
        return (
          Number.isFinite(value) &&
          (value === Math.floor(value) || value.toFixed(2) === value.toString())
        );
      },
      message: "Wallet value must be a float with up to two decimal places.",
    },
  },
  role: {
    type: String,
    enum: ["user", "admin", "traffic warden"],
    default: "user",
  },
  // vehicle: [{ type: mongoose.Types.ObjectId, require: true, ref: "Vehicle" }], // get Id from the User Model in the mongodb
});

// use the validator function
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
