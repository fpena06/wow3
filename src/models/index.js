const { User, userValidation } = require("./user");
const { Company } = require("./company");
const { Admin } = require("./admin");
const { Transaction } = require("./transaction");
const mongoose = require("mongoose");

module.exports = {
  userValidation: userValidation,
  User: mongoose.model("User", User),
  Admin: mongoose.model("Admin", Admin),
  Company: mongoose.model("Company", Company),
  Transaction: mongoose.model("Transaction", Transaction)
};
