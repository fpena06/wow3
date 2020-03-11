let { Admin, User, Company } = require("../models");
exports.login = async (req, res) => {
  const admin = await Admin.findOne({ email: req.body.email });
  if (!admin) {
    return res.send("Invalid credentials  ...");
  } else {
    if (req.body.password == admin.password) {
      let token = await jwt.sign(
        { mobile: req.body.mobile, password: req.body.password },
        config.get("TOKEN")
      );
      res.header("x-auth-token", token).send("Suceefully logged in ..."); // Token to be included after generation
    }
  }
};

exports.updateCompanyShareValue = async (req, res) => {
  let company = await Company.findById(req.body._id);
  await Company.findByIdAndUpdate(req.body._id, {
    previousValue: [...company.previousValue, company.shareValue],
    shareValue: req.body.shareValue
  });
  company = await Company.findById(req.body._id);
  console.log(company);
  await res.io.emit("global", { company: company, type: "company" });
  res.send(company);
};

exports.dashboard = async (req, res) => {
  const userList = await User.find({}, "name");
  res.send(userList);
};
