const { User, userValidation } = require("./user");
const { Company, companyValidation } = require("./company");
const { Admin } = require("./admin");
const { Transaction } = require("./transaction");
const { News } = require("./news");
const { Broker } = require("./broker");
const mongoose = require("mongoose");
const { Watchlist } = require("./watchlist");

module.exports = {
  News: mongoose.model("News", News),
  userValidation: userValidation,
  companyValidation: companyValidation,
  User: mongoose.model("User", User),
  Admin: mongoose.model("Admin", Admin),
  Broker: mongoose.model("Broker", Broker),
  Company: mongoose.model("Company", Company),
  Watchlist: mongoose.model("Watchlist", Watchlist),
  Transaction: mongoose.model("Transaction", Transaction),
};
