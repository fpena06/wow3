let { Admin, User } = require("../models");
exports.login = async (req, res) => {
  const admin = await Admin.findOne({ email: req.body.email });
  if (!admin) {
    return res.send("Invalid credentials  ...");
  } else {
    if (req.body.password == admin.password) {
      res.send("Suceefully logged in ..."); // Token to be included after generation
    }
  }
};

exports.user = async (req, res) => {
  const user = await User.findById(req.body._id);
  res.send(user);
};

exports.dashboard = async (req, res) => {
  const userList = await User.find({}, "name");
  res.send(userList);
};
