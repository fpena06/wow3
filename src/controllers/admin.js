let { Admin, User, Company, userValidation, News } = require("../models");

// admin login

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

// change company share value

exports.updateCompanyShareValue = async (req, res) => {
  let company = await Company.findById(req.body._id);
  await Company.findByIdAndUpdate(req.body._id, {
    previousValue: [...company.previousValue, company.shareValue],
    shareValue: req.body.shareValue
  });
  company = await Company.findById(req.body._id);
  await res.io.emit("global", { company: company, type: "company" });
  res.send(company);
};

exports.dashboard = async (req, res) => {
  const userList = await User.find({}, "name");
  res.send(userList);
};

// add user

exports.addUser = async (req, res) => {
  let { error } = await userValidation(req.body);
  if (error) {
    console.log(error);
    return res.send("Error", error.details[0].message);
  }
  let user = await User.findOne({
    email: req.body.email,
    mobile: req.body.mobile
  });
  if (user)
    return res.json({
      message: "User Already Exist..."
    });
  user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    mobile: req.body.mobile,
    watchList: [],
    currentHoldings: []
  });
  await user.save();
  res.json({
    message: "User added sucessfully"
  });
};

// user details

exports.userDetails = async (req, res) => {
  const user = await User.findOne({
    mobile: req.body.mobile
  }).select(["name", "email", "password", "mobile"]);
  res.send(user);
};

// news updation

exports.addNews = async (req, res) => {
  news = new News({
    description: req.body.description
  });
  await news.save();
  res.send(news);
};
