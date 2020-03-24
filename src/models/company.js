const mongoose = require("mongoose");
const Joi = require("joi");
const CompanySchema = mongoose.Schema({
  name: { type: String, unique: true },
  category: String,
  shareValue: Number,
  shareCount: Number,
  previousValue: [{ value: { type: Number }, time: Date }]
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
