const mongoose = require("mongoose");

const AdminSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: Number, required: true, unique: true }
});

module.exports = { Admin: AdminSchema };
