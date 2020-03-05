const mongoose = require("mongoose");

const CompanySchema = mongoose.Schema({
  name: String,
  category: String,
  shareValue: Number,
  currentHolders: [
    {
      User_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      shareCount: { type: Number }
    }
  ],
  shareCount: Number,
  previousValue: [{ type: Number }]
});

module.exports = { Company: CompanySchema };
