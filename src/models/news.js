const mongoose = require("mongoose");

const NewsSchema = mongoose.Schema({
  description: String,
  time: Date
});

module.exports = { News: NewsSchema };
