let { User, Broker } = require("../models");
const jwt = require("jsonwebtoken");
const config = require("config");

//add broker

exports.addBroker = async (req, res) => {
  broker = new Broker({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    mobile: req.body.mobile
  });
  await broker.save();
  res.json({
    message: "broker added sucessfully"
  });
};

// broker login

exports.login = async (req, res) => {
  console.log(req.body);
  const broker = await Broker.findOne({ mobile: req.body.mobile });
  if (!broker) {
    return res.send("Invalid credentials  ...");
  } else {
    if (req.body.password == broker.password) {
      let token = await jwt.sign(
        { mobile: req.body.mobile, password: req.body.password },
        config.get("TOKEN")
      );
      res.send({
        message: "Suceefully logged in ...",
        user: broker,
        token: token
      }); // Token to be included after generation
    }
  }
};

// advise taken

exports.brokerTip = async (req, res) => {
  let user = await User.findOne({ mobile: req.body.mobile });
  User.findByIdAndUpdate(user._id, {
    walletAmount: user.walletAmount - req.body.tipAmount
  });
  console.log("updated user: ", user);
  res.send({ message: "money deducted successfully " });
};
