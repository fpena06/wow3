const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const routes = require("./routes");
const config = require("config");
const app = express();
app;

app.disable("x-powered-by");
app.use(express.json());
mongoose.connect(
  "mongodb://localhost/wows3",
  {
    useFindAndModify: false,
    useCreateIndex: true,
    useFindAndModify: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
  },
  err => {
    if (err) {
      console.log("Error Connecting Database");
      console.log(err);
      process.exit(1);
    }
  }
);
app.get("/", (req, res) => {
  res.send({ message: config.get("dburl") });
});
app.use("/user", routes.user);
app.use("/admin", routes.admin);
app.listen(3000, "localhost", err => {
  if (err) console.log(err);
});
