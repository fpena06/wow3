let {
  Admin,
  User,
  Company,
  companyValidation,
  userValidation,
  News,
  Transaction,
} = require("../models");
const jwt = require("jsonwebtoken");
const config = require("config");

//add admin

exports.addAdmin = async (req, res) => {
  admin = new Admin({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    mobile: req.body.mobile,
  });
  await admin.save();
  res.json({
    message: "admin added sucessfully",
  });
};

// admin login

exports.login = async (req, res) => {
  const admin = await Admin.findOne({ mobile: req.body.mobile });
  if (!admin) {
    return res.send("Invalid credentials  ...");
  } else {
    if (req.body.password == admin.password) {
      let token = await jwt.sign(
        { mobile: req.body.mobile, password: req.body.password },
        config.get("TOKEN2")
      );
      res.send({
        message: "Suceefully logged in ...",
        user: admin,
        token: token,
      }); // Token to be included after generation
    }
  }
};

// admin dashboard

exports.dashboard = async (req, res) => {
  let companies = await Company.find();

  let uniqueCategory = [...new Set(companies.map((c) => c.category))];
  res.send(uniqueCategory);
};

//dashboard after selecting category

exports.dashboardCategory = async (req, res) => {
  const companyCategory = await Company.find({
    category: req.body.category,
  }).select(["name", "shareValue", "shareCount", "previousValue"]);
  return res.send({ companies: companyCategory });
};

// add company

exports.addCompany = async (req, res) => {
  var currentTime = new Date();

  var currentOffset = currentTime.getTimezoneOffset();

  var ISTOffset = 330;
  let { error } = await companyValidation(req.body);
  if (error) {
    return res.send("Error", error.details[0].message);
  }
  let company = await Company.findOne({ name: req.body.name });
  if (!company) {
    company = new Company({
      name: req.body.name,
      category: req.body.category,
      shareValue: req.body.shareValue,
      shareCount: req.body.shareCount,
      previousValue: [
        {
          value: req.body.shareValue,
          time: new Date(
            currentTime.getTime() + (ISTOffset + currentOffset) * 60000
          ),
        },
      ],
    });
    await company.save();
    res.json({
      message: "Company added sucessfully",
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
    if (changeValue === 0)
      return res.send({ message: "previous and current value cannot be same" });
    await Company.findByIdAndUpdate(req.body.Company_id, {
      previousValue: [
        ...company.previousValue,
        {
          value: company.shareValue,
          time: new Date(
            currentTime.getTime() + (ISTOffset + currentOffset) * 60000
          ),
        },
      ],
      shareValue: req.body.shareValue,
    });
    /*let users = await User.find({
      "watchList.Company_id": req.body.Company_id,
    });
    let n = users.length;
    for (let j = 0; j < n; j++) {
      let p = users[j];
      let m = p.watchList.length;
      for (let i = 0; i < m; i++) {
        if (
          p.watchList[i].Company_id.toString() ===
          req.body.Company_id.toString()
        ) {
          p.watchList.splice(i, 1, {
            Company_id: req.body.Company_id,
            name: p.watchList[i].name,
            shareValue: req.body.shareValue,
            shareValuePercentage: shareValuePercentage,
          });
          await User.findByIdAndUpdate(p._id, {
            watchList: p.watchList,
          });
        }
      }
    }*/
    res.io.emit("global", { type: "stat" });

    res.io.emit("global", { name: company.name, type: "stockbar" });
    res.io.emit("global", { type: "company" });
    res.send({ message: "Updated successfully" });
  } else return res.send({ message: "No such company exist" });
};
// add user

exports.addUser = async (req, res) => {
  let { error } = await userValidation(req.body);
  if (error) {
    return res.send("Error", error.details[0].message);
  }
  let user = await User.findOne({
    mobile: req.body.mobile,
  });
  if (user)
    return res.json({
      message: "User Already Exist...",
    });
  user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    mobile: req.body.mobile,
    currentHoldings: [],
  });
  await user.save((err) => {
    if (err) return res.send({ message: "User not created" });
    else
      res.json({
        message: "User added sucessfully",
      });
  });
};

// user details

exports.userDetails = async (req, res) => {
  const user = await User.findOne({
    mobile: req.body.mobile,
  }).select(["name", "email", "password", "mobile"]);
  if (!user) return res.send({ message: "user does not exist" });
  res.send({ user: user });
};

// news updation

exports.addNews = async (req, res) => {
  news = new News({
    description: req.body.description,
    time: new Date(),
  });
  await news.save();
  res.io.emit("global", { type: "news" });
  res.send({ message: "News added in queue" });
};

//news display

exports.newsDisplay = async (req, res) => {
  const news = await News.find().sort({ time: -1 });
  res.send({ message: "news added ", news: news });
};

// leaderboard

exports.leaderboard = async (req, res) => {
  try {
    let leaderboardUsers = await User.find()
      .sort({ walletAmount: -1 })
      .select(["_id", "name", "walletAmount", "mobile"]);

    let leaderboardUsers2 = [];
    let len = leaderboardUsers.length;
    for (let i = 0; i < len; i++) {
      let transaction = await Transaction.findOne({
        userID: leaderboardUsers[i]._id.toString(),
      });
      console.log(transaction);
      if (transaction) {
        leaderboardUsers2.push(leaderboardUsers[i]);
      }
    }
    return res.send(leaderboardUsers2);
  } catch (ex) {
    console.log(ex);
    res.send({ message: "Internal Server Error" });
  }
};

// transaction

exports.transaction = async (req, res) => {
  let user = await User.findOne({ mobile: req.body.mobile });
  const userTransactions = await Transaction.find({
    userID: user._id.toString(),
  }).sort({ time: -1 });
  let userTransaction = [];
  let company;
  let sharePrice;
  let t;
  let len = userTransactions.length;
  for (let i = 0; i < len; i++) {
    t = userTransactions[i];

    company = await Company.findById(t.companyID.toString());
    sharePrice = t.shareAmount / t.numberOfShares;

    userTransaction.push({
      time: t.time,
      companyName: company.name,
      sharePrice: sharePrice,
      shareQuantity: t.numberOfShares,
      totalAmount: t.shareAmount,
      type: t.type,
    });
  }
  return res.send({
    message: "transaction of user",
    userTransaction: userTransaction,
  });
};

// get company

exports.company = async (req, res) => {
  let company = await Company.find();
  res.send({ message: "Companies", company: company });
};
