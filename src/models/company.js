const mongoose = require("mongoose");
const Joi = require("joi");
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

function companyValidation(Company) {
  const schema = Joi.object({
    name: Joi.string().required(),
    category: Joi.string().required(),
    shareValue: Joi.required(),
    shareCount: Joi.required()
  });
  return Joi.validate(Company, schema);
}

module.exports = {
  Company: CompanySchema,
  companyValidation: companyValidation
};
