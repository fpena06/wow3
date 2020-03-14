let {
  Admin,
  User,
  Company,
  companyValidation,
  userValidation,
  News,
  Transaction
} = require("../models");
const jwt = require("jsonwebtoken");
const config = require("config");

//add admin

exports.addAdmin = async (req, res) => {
  admin = new Admin({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    mobile: req.body.mobile
  });
  await admin.save();
  res.json({
    message: "admin added sucessfully"
  });
};

// admin login

exports.login = async (req, res) => {
  console.log(req.body);
  const admin = await Admin.findOne({ mobile: req.body.mobile });
  console.log(admin);
  if (!admin) {
    return res.send("Invalid credentials  ...");
  } else {
    if (req.body.password == admin.password) {
      let token = await jwt.sign(
        { mobile: req.body.mobile, password: req.body.password },
        config.get("TOKEN")
      );
      res
        .header("x-auth-token", token)
        .send({ message: "Suceefully logged in ...", user: admin }); // Token to be included after generation
    }
  }
};

// add company

exports.addCompany = async (req, res) => {
  var currentTime = new Date();

  var currentOffset = currentTime.getTimezoneOffset();

  var ISTOffset = 330;
  let { error } = await companyValidation(req.body);
  if (error) {
    console.log(error);
    return res.send("Error", error.details[0].message);
  }
  let company = await Company.findOne({ name: req.body.name });
  if (!company) {
    company = new Company({
      name: req.body.name,
      category: req.body.category,
      shareValue: req.body.shareValue,
      currentHolders: [],
      shareCount: req.body.shareCount,
      previousValue: [
        {
          value: req.body.shareValue,
          time: new Date(
            currentTime.getTime() + (ISTOffset + currentOffset) * 60000
          )
        }
      ]
    });
    await company.save();
    res.json({
      message: "Company added sucessfully"
    });
  } else return res.send({ message: "company already exist" });
};

// change company share value

exports.updateCompanyShareValue = async (req, res) => {
  var currentTime = new Date();

  var currentOffset = currentTime.getTimezoneOffset();

  var ISTOffset = 330;
  let company = await Company.findById(req.body.Company_id);
  if (!req.body.shareValue) return res.send("share value is needed");
  if (company) {
    let changeValue = req.body.shareValue - company.shareValue;
    let shareValuePercentage = (changeValue / company.shareValue) * 100;
    let status;
    if (changeValue === 0)
      return res.send({ message: "previous and current value cannot be same" });
    else if (changeValue < 0) status = "down";
    else status = "up";
    await Company.findByIdAndUpdate(req.body.Company_id, {
      previousValue: [
        ...company.previousValue,
        {
          value: company.shareValue,
          time: new Date(
            currentTime.getTime() + (ISTOffset + currentOffset) * 60000
          )
        }
      ],
      shareValue: req.body.shareValue
    });
    let users = await User.find();
    for (let j = 0; j < users.length; j++) {
      let p = users[j];
      for (let i = 0; i < p.watchList.length; i++) {
        if (
          p.watchList[i].Company_id.toString() ===
          req.body.Company_id.toString()
        ) {
          let name = p.watchList[i].name;
          p.watchList.splice(i, 1, {
            Company_id: req.body.Company_id,
            name: name,
            shareValue: req.body.shareValue,
            shareValuePercentage: shareValuePercentage
          });
          let updatedWatchlist = p.watchList;
          console.log("user watchlist before updation: ", p.watchList);
          await User.findByIdAndUpdate(p._id, {
            watchList: updatedWatchlist
          });
          console.log("user watchlist after updation: ", p.watchList);
        }
      }
    }
    company = await Company.findById(req.body.Company_id);
    const grossingCompany = await Company.find()
      .sort({ shareValue: -1 })
      .limit(1)
      .select("name");
    const leaderboardTop = await User.find()
      .sort({ walletAmount: -1 })
      .limit(1)
      .select(["name", "walletAmount"]);
    const global = {
      leaderboardTop,
      grossingCompany
    };

    await res.io.emit("global", { global: global, type: "stat" });

    res.io.emit("global", {
      company: company,
      status: status,
      type: "stockbar"
    });
    res.io.emit("global", { company: company, type: "company" });
    res.send({ company, status });
  } else return res.send({ message: "No such company exist" });
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
  await user.save(err => {
    if (err) return res.send({ message: "User not created" });
    else
      res.json({
        message: "User added sucessfully"
      });
  });
};

// user details

exports.userDetails = async (req, res) => {
  const user = await User.findOne({
    mobile: req.body.mobile
  }).select(["name", "email", "password", "mobile"]);
  if (!user) return res.send("user does not exist");
  res.send(user);
};

// news updation

exports.addNews = async (req, res) => {
  news = new News({
    description: req.body.description,
    time: new Date()
  });
  await news.save();
  const news1 = await News.find()
    .limit(10)
    .sort({ time: -1 });
  res.io.emit("global", { news: news1, type: "news" });
  res.send(news);
};

// leaderboard

exports.leaderboard = async (req, res) => {
  const leaderboardUsers = await User.find()
    .sort({ walletAmount: -1 })
    .select(["name", "walletAmount"])
    .limit(80);
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
