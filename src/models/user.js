const mongoose = require("mongoose");
const Joi = require("joi");
const UserSchema = mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  walletAmount: { type: Number, default: 100000 },
  watchList: [
    {
      name: { type: String },
      shareValue: { type: Number },
      previousValue: { type: Array }
    }
  ],
  currentHoldings: [
    {
      Company_id: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
      sharePrice: { type: Number },
      shareAmount: { type: Number },
      shareCount: { type: Number }
    }
  ]
});

function userValidation(User) {
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string()
      .required()
      .email(),
    password: Joi.string().required(),
    mobile: Joi.string().required()
  });
  return Joi.validate(User, schema);
}

module.exports = { User: UserSchema, userValidation: userValidation };
