const { User, userValidation } = require("./user");
const { Company, companyValidation } = require("./company");
const { Admin } = require("./admin");
const { Transaction } = require("./transaction");
const { News } = require("./news");
const mongoose = require("mongoose");

module.exports = {
  News: mongoose.model("News", News),
  userValidation: userValidation,
  companyValidation: companyValidation,
  User: mongoose.model("User", User),
  Admin: mongoose.model("Admin", Admin),
  Company: mongoose.model("Company", Company),
  Transaction: mongoose.model("Transaction", Transaction)
};
