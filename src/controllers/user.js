let { User, Company, Transaction, News } = require("../models");
const config = require("config");
const jwt = require("jsonwebtoken");

//get end time

exports.time = async (req, res) => {
  const time = config.get("ENDTIME");
  res.send({ message: "Hey there", time });
};

// user login

exports.login = async (req, res) => {
  const user = await User.findOne({
    mobile: req.body.mobile
  });
  if (!user) {
    return res.send("Invalid credentials...");
  } else {
    if (req.body.password === user.password) {
      let token = await jwt.sign(
        { mobile: req.body.mobile, password: req.body.password },
        config.get("TOKEN")
      );
      res.send({
        message: "Sucessfully logged in ...",
        user: { mobile: user.mobile, name: user.name, _id: user._id },
        token
      });
    } else return res.send({ message: "incorrect password" });
  }
};

//user change password

exports.changePassword = async (req, res) => {
  const user = await User.findOne({
    mobile: req.body.mobile
  });
  if (user.password != req.body.oldPassword) {
    return res.send({
      message: "old password is incorrect. please enter valid password"
    });
  }
  user.password = req.body.newPassword;
  await user.save();
  res.send({ message: "password updated successfully" });
};

//user dashboard stats

exports.dashboardSocket = async data => {
  const user = await User.findOne({
    mobile: data.mobile
  });
  return user;
};

//user dashboard
exports.dashboard = async (req, res) => {
  const user = await User.findOne({
    mobile: req.body.mobile
  });
  const userWalletAmount = user.walletAmount;
  const grossingCompany = await Company.find()
    .sort({ shareValue: -1 })
    .limit(1)
    .select("name");
  let userShareAmount = 0;
  for (let i = 0; i < user.currentHoldings.length; i++) {
    userShareAmount = userShareAmount + user.currentHoldings[i].shareAmount;
  }
  console.log("User shareAmount: ", userShareAmount);
  const leaderboardTop = await User.find()
    .sort({ walletAmount: -1 })
    .limit(1)
    .select(["name", "walletAmount"]);
  return res.send({
    userShareAmount,
    userWalletAmount,
    grossingCompany,
    leaderboardTop
  });
};

// user dashboard for category

exports.category = async (req, res) => {
  let companies = await Company.find();

  let uniqueCategory = [...new Set(companies.map(c => c.category))];
  res.send(uniqueCategory);
};

//user dashboard after selecting category

exports.dashboardCategory = async (req, res) => {
  let decoded = await jwt.decode(
    req.headers["x-access-token"],
    config.get("TOKEN")
  );
  const companyCategory = await Company.find({
    category: req.body.category
  }).select(["name", "shareValue", "shareCount", "previousValue"]);

  const user = await User.findOne({ mobile: decoded.mobile });
  const userCurrentHoldings = await user.currentHoldings;

  let xyz = await companyCategory.map(company => {
    let foundCompany = userCurrentHoldings.find(
      p => p.Company_id.toString() == company._id.toString()
    );
    let obj = {
      _id: company._id,
      name: company.name,
      shareValue: company.shareValue,
      shareCount: company.shareCount,
      previousValue: company.previousValue,
      boughtVolume: foundCompany ? foundCompany.shareCount : 0
    };

    return obj;
  });
  return res.send({ companies: xyz });
};

// news display

exports.newsDisplay = async (req, res) => {
  const news = await News.find()
    .limit(10)
    .sort({ time: -1 });
  res.send(news);
};

//user leaderboard

exports.leaderboard = async (req, res) => {
  let user = await jwt.decode(
    req.headers["x-access-token"],
    config.get("TOKEN")
  );
  const leaderboardUsers = await User.find()
    .sort({ walletAmount: -1 })
    .select(["name", "walletAmount", "mobile"]);

  let rank = leaderboardUsers.findIndex(p => p.mobile === user.mobile) + 1;
  return res.send({ leaderboardUsers, rank });
};

// transactions

exports.transaction = async (req, res) => {
  const userTransactions = await Transaction.find({
    userID: req.body.User_id
  }).sort({ time: -1 });

  let userTransaction = [];
  let userCurrentHoldings = [];
  let company;
  let sharePrice;
  let t;
  let c;

  for (let i = 0; i < userTransactions.length; i++) {
    t = userTransactions[i];

    company = await Company.findById(t.companyID.toString());
    sharePrice = t.shareAmount / t.numberOfShares;

    userTransaction.push({
      time: t.time,
      companyName: company.name,
      sharePrice: sharePrice,
      shareQuantity: t.numberOfShares,
      totalAmount: t.shareAmount,
      type: t.type
    });
  }

  let user = await User.findById(req.body.User_id);

  for (let i = 0; i < user.currentHoldings.length; i++) {
    c = user.currentHoldings[i];
    company = await Company.findById(c.Company_id.toString());

    userCurrentHoldings.push({
      companyName: company.name,
      shareCount: c.shareCount
    });
  }
  return res.send({
    userTransaction: userTransaction,
    userCurrentHoldings: userCurrentHoldings
  });
};

//buy shares

hello = async (req, res) => {
  console.log("***** Buy Share Logs *****");
  let d1 = new Date().getTime();
  const user = await User.findById(req.body.User_id)
    .select(["walletAmount", "currentHoldings"])
    .lean();

  const userCurrentWalletAmt = user.walletAmount;

  const company = await Company.findById(req.body.Company_id)
    .select(["shareValue", "shareCount"])
    .lean();

  const companyShareValue = company.shareValue;
  const companyShareCount = company.shareCount;
  const userShareCount = req.body.shareCount;
  const calculatedShareAmt = companyShareValue * userShareCount;

  const newWalletAmt = userCurrentWalletAmt - calculatedShareAmt;
  let newCurrentHolding;

  if (userShareCount > companyShareCount) {
    return res.send({ message: "Enter valid number of shares..." });
  }

  if (userCurrentWalletAmt < calculatedShareAmt) {
    return res.send({ message: "user do not have required amount..." });
  }

  const existingCompanies = await User.findOne({
    _id: req.body.User_id,
    "currentHoldings.Company_id": req.body.Company_id
  }).select("currentHoldings");

  if (!existingCompanies) {
    newCurrentHolding = {
      Company_id: req.body.Company_id,
      sharePrice: companyShareValue,
      shareAmount: calculatedShareAmt,
      shareCount: userShareCount
    };
    await User.findByIdAndUpdate(req.body.User_id, {
      walletAmount: newWalletAmt,
      $push: { currentHoldings: newCurrentHolding }
    });
  } else {
    const existingCompany = existingCompanies.currentHoldings.find(
      c => c.Company_id.toString() === req.body.Company_id
    );

    newCurrentHolding = {
      Company_id: req.body.Company_id,
      sharePrice: companyShareValue,
      shareAmount: calculatedShareAmt,
      shareCount: existingCompany.shareCount + userShareCount
    };

    await User.findByIdAndUpdate(req.body.User_id, {
      $pull: { currentHoldings: { Company_id: req.body.Company_id } }
    });

    await User.findByIdAndUpdate(req.body.User_id, {
      walletAmount: newWalletAmt,
      $push: { currentHoldings: newCurrentHolding }
    });
  }

  await Company.findByIdAndUpdate(req.body.Company_id, {
    shareCount: companyShareCount - userShareCount
  });

  const currentTime = new Date();
  const currentOffset = currentTime.getTimezoneOffset();
  const ISTOffset = 330;

  let transaction = new Transaction({
    userID: req.body.User_id,
    companyID: req.body.Company_id,
    time: new Date(currentTime.getTime() + (ISTOffset + currentOffset) * 60000),
    type: "buy",
    numberOfShares: userShareCount,
    shareAmount: calculatedShareAmt
  });

  await transaction.save();

  let d2 = new Date().getTime();

  console.log(`${d2} - ${d1} = ${d2 - d1}`);
  console.log("************************");
  res.json({ message: "Shares bought sucessfully..." });
};

exports.buyShares = async (req, res) => {
  const user = await User.findById(req.body.User_id);
  const company = await Company.findById(req.body.Company_id);
  const shareAmount = company.shareValue * req.body.shareCount;
  const currentHoldingsWanted = user.currentHoldings.findOne(
    p => p.Company_id.toString() === req.body.Company_id
  );

  if (req.body.shareCount > company.shareCount)
    return res.send({ message: "Enter valid number of shares..." });
  if (user.walletAmount < shareAmount)
    return res.send({ message: "user do not have required amount..." });
  var currentTime = new Date();

  var currentOffset = currentTime.getTimezoneOffset();

  var ISTOffset = 330;
  if (!currentHoldingsWanted) {
    company.shareCount = company.shareCount - req.body.shareCount;
    await Company.findByIdAndUpdate(req.body.Company_id, {
      shareCount: company.shareCount
    });
    await User.findByIdAndUpdate(req.body.User_id, {
      walletAmount: user.walletAmount - shareAmount,
      currentHoldings: [
        ...user.currentHoldings,
        {
          Company_id: req.body.Company_id,
          sharePrice: company.shareValue,
          shareAmount: shareAmount,
          shareCount: req.body.shareCount
        }
      ]
    });
  } else {
    const walletAmount =
      user.walletAmount - company.shareValue * req.body.shareCount;
    const shareCount = company.shareCount - req.body.shareCount;
    let newHoldings = user.currentHoldings.filter(
      p => p.Company_id.toString() != req.body.Company_id.toString()
    );

    let newObj = {
      Company_id: req.body.Company_id,
      sharePrice: company.shareValue,
      shareAmount:
        (currentHoldingsWanted.shareCount + req.body.shareCount) *
        company.shareValue,
      shareCount: currentHoldingsWanted.shareCount + req.body.shareCount
    };

    newHoldings.push(newObj);
    await User.findByIdAndUpdate(req.body.User_id, {
      walletAmount: walletAmount,
      currentHoldings: newHoldings
    });

    await Company.findByIdAndUpdate(req.body.Company_id, {
      shareCount: shareCount
    });
  }
  transaction = new Transaction({
    userID: req.body.User_id,
    companyID: req.body.Company_id,
    time: new Date(currentTime.getTime() + (ISTOffset + currentOffset) * 60000),
    type: "buy",
    numberOfShares: req.body.shareCount,
    shareAmount: company.shareValue * req.body.shareCount
  });
  await transaction.save();
  await res.io.emit("user", { type: "company" });
  await res.io.emit("global", { type: "company" });
  await res.io.emit("global", { type: "stat" });
  await res.io.emit("user", { type: "stat" });
  res.send({ message: "Shares bought sucessfully..." });
};

//sell shares

exports.sellShares = async (req, res) => {
  const user = await User.findById(req.body.User_id);
  const company = await Company.findById(req.body.Company_id);
  const currentHoldingsWanted = user.currentHoldings.find(
    p => p.Company_id.toString() == req.body.Company_id.toString()
  );
  if (!currentHoldingsWanted)
    return res.send({ message: "do not have shares to sell" });
  if (currentHoldingsWanted.shareCount < req.body.shareCount)
    return res.send({ message: "do not have enough shares to sell" });
  var currentTime = new Date();

  var currentOffset = currentTime.getTimezoneOffset();

  var ISTOffset = 330;
  if (currentHoldingsWanted.shareCount == req.body.shareCount) {
    let newHoldings = user.currentHoldings.filter(
      p => p.Company_id.toString() != req.body.Company_id.toString()
    );

    let walletAmount =
      company.shareValue * req.body.shareCount + user.walletAmount;

    await User.findByIdAndUpdate(req.body.User_id, {
      walletAmount: walletAmount,
      currentHoldings: newHoldings
    });

    await Company.findByIdAndUpdate(req.body.Company_id, {
      shareCount: company.shareCount + req.body.shareCount
    });
  } else {
    let newHoldings = user.currentHoldings.filter(
      p => p.Company_id.toString() != req.body.Company_id.toString()
    );

    let newObj = {
      Company_id: req.body.Company_id,
      sharePrice: company.shareValue,
      shareAmount:
        (currentHoldingsWanted.shareCount - req.body.shareCount) *
        company.shareValue,
      shareCount: currentHoldingsWanted.shareCount - req.body.shareCount
    };

    newHoldings.push(newObj);

    let walletAmount =
      company.shareValue * req.body.shareCount + user.walletAmount;

    await User.findByIdAndUpdate(req.body.User_id, {
      walletAmount: walletAmount,
      currentHoldings: newHoldings
    });

    await Company.findByIdAndUpdate(req.body.Company_id, {
      shareCount: company.shareCount + req.body.shareCount
    });
  }
  transaction = new Transaction({
    userID: req.body.User_id,
    companyID: req.body.Company_id,
    time: new Date(currentTime.getTime() + (ISTOffset + currentOffset) * 60000),
    type: "sell",
    numberOfShares: req.body.shareCount,
    shareAmount: company.shareValue * req.body.shareCount
  });
  await transaction.save();
  await res.io.emit("user", { type: "company" });
  await res.io.emit("global", { type: "company" });
  await res.io.emit("global", { type: "stat" });
  await res.io.emit("user", { type: "stat" });
  res.send({ message: "Shares Sold Successfully" });
};

// add to watchlist

exports.addToWatchlist = async (req, res) => {
  const user = await User.findOne({
    mobile: req.body.mobile
  });
  const company = await Company.findById(req.body.Company_id).select([
    "_id",
    "name",
    "shareValue",
    "previousValue"
  ]);
  let flag = 0;
  user.watchList.forEach(p => {
    if (p.name === company.name) return (flag = 1);
  });
  if (flag === 0) {
    const shareValueChange =
      company.shareValue -
      company.previousValue[company.previousValue.length - 1].value;
    const shareValuePercentage = Number(
      ((shareValueChange / company.shareValue) * 100).toFixed()
    );
    await User.findByIdAndUpdate(user._id, {
      watchList: [
        ...user.watchList,
        {
          Company_id: company._id,
          name: company.name,
          shareValue: company.shareValue,
          shareValuePercentage
        }
      ]
    });
  } else return res.send({ message: "company already exist in watchlist" });
  await res.io.emit("user", { type: "watchlist" });
  res.send({ message: "added to watchlist sucessfully" });
};

// remove from watchlist

exports.removeFromWatchlist = async (req, res) => {
  const user = await User.findOne({
    mobile: req.body.mobile
  });
  const company = await Company.findById(req.body.Company_id);
  let checkWatchlist = user.watchList.find(
    p => p.name.toString() === company.name.toString()
  );
  if (!user) return res.send({ message: "user not present in database..." });
  if (!checkWatchlist)
    return res.send({ message: "company not present in watchlist" });
  let newWatchlist = user.watchList.filter(
    p => p.name.toString() != company.name.toString()
  );
  await User.findByIdAndUpdate(user._id, {
    watchList: newWatchlist
  });
  await res.io.emit("user", { type: "watchlist" });
  res.send({ message: "removed from watchlist sucessfully" });
};

// display watchlist

exports.watchlist = async (req, res) => {
  const user = await User.findOne({ mobile: req.body.mobile });
  if (!user) return res.send({ message: "user not valid" });
  const userWatchlist = await user.watchList;
  res.send(userWatchlist);
};

// stockbar

exports.stockbar = async (req, res) => {
  const companies = await Company.find();
  let stockbar = [];
  for (let i = 0; i < companies.length; i++) {
    let company = companies[i];
    let changeValue =
      company.shareValue -
      company.previousValue[company.previousValue.length - 1].value;
    let status = changeValue >= 0 ? "up" : "down";
    let obj = {
      companyName: company.name,
      stat: status
    };
    stockbar.push(obj);
  }
  res.send({ stockbar });
};
