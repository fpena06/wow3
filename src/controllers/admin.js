let {
  Admin,
  User,
  Company,
  companyValidation,
  userValidation,
  News,
  Transaction
} = require("../models");

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

// add company

exports.addCompany = async (req, res) => {
  let { error } = await companyValidation(req.body);
  if (error) {
    console.log(error);
    return res.send("Error", error.details[0].message);
  }
  company = new Company({
    name: req.body.name,
    category: req.body.category,
    shareValue: req.body.shareValue,
    currentHolders: [],
    shareCount: req.body.shareCount,
    previousValue: []
  });
  await company.save();
  res.json({
    message: "Company added sucessfully"
  });
};

// change company share value

exports.updateCompanyShareValue = async (req, res) => {
  let company = await Company.findById(req.body.Company_id);
  let changeValue = company.shareValue - req.body.shareValue;
  let status;
  if (changeValue === 0)
    return res.send({ message: "previous and current value cannot be same" });
  else if (changeValue > 0) status = "down";
  else status = "up";
  await Company.findByIdAndUpdate(req.body.Company_id, {
    previousValue: [...company.previousValue, company.shareValue],
    shareValue: req.body.shareValue
  });
  company = await Company.findById(req.body.Company_id);
  // await res.io.emit("global", { company: company, type: "company" });
  res.send({ company, status });
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

// leaderboard

exports.leaderboard = async (req, res) => {
  const leaderboardUsers = await User.find()
    .sort({ walletAmount: -1 })
    .select(["name", "walletAmount"]);
  return res.send(leaderboardUsers);
};

// transaction

exports.transaction = async (req, res) => {
  const user = await User.findOne({ mobile: req.body.mobile });
  const userTransaction = await Transaction.find({
    userID: user._id.toString()
  });
  return res.send({ userTransaction });
};
