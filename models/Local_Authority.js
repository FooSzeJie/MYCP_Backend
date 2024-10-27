const mongoose = require("mongoose");

const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const localAuthoritySchema = new Schema({
  name: { type: String, required: true },
  nickname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  no_telephone: { type: Number, required: true, unique: true },
  area: { type: String, required: true },
  state: { type: String, required: true },
});

// Use the Validator function
localAuthoritySchema.plugin(uniqueValidator);

module.exports = mongoose.model("Local_Authority", localAuthoritySchema);
