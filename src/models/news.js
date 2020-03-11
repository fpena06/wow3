const mongoose = require("mongoose");

const NewsSchema = mongoose.Schema({
  description: String
});

module.exports = { News: NewsSchema };
