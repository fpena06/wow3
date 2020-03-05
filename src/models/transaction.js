const mongoose = require("mongoose");

const TransactionSchema = mongoose.Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  companyID: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  time: Date,
  type: String,
  numberOfShares: Number,
  shareAmount: Number
});

module.exports = { Transaction: TransactionSchema };
