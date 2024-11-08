const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  no_telephone: {
    type: Number,
    required: true,
    unique: true,
    get: (v) => {
      // Format the number as "+011 1020 1369"
      const str = v.toString().padStart(10, "0"); // Pad with leading zeros if needed
      return `+60${str}`;
    },
    set: (v) => {
      // Remove any non-numeric characters and parse as an integer
      const num = parseInt(String(v).replace(/\D/g, ""), 10);
      return isNaN(num) ? undefined : num; // If parsing fails, store undefined
    },
  },
  wallet: {
    type: Number,
    default: 0,
    get: (v) => v / 100,
    set: (v) => Math.round(v * 100),
  },
  role: {
    type: String,
    enum: ["user", "admin", "traffic warden"],
    default: "user",
  },
  vehicles: [{ type: mongoose.Types.ObjectId, required: true, ref: "Vehicle" }],
  parking_history: [
    { type: mongoose.Types.ObjectId, required: true, ref: "Car_Parking" },
  ],
});

// Use the validator function
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
