let { User, Company, Transaction, News } = require("../models");
const mongoose = require("mongoose");
const config = require("config");
const jwt = require("jsonwebtoken");

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
        user: { mobile: user.mobile, name: user.name },
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
    return res.send("old password is incorrect. please enter valid password");
  }
  user.password = req.body.newPassword;
  await user.save();
  res.send("password updated sucessfully");
  console.log("password updated sucessfully");
};

//user dashboard stats

exports.dashboardSocket = async data => {
  console.log(data.mobile);
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
  console.log(uniqueCategory);
  res.send(uniqueCategory);
};

//user dashboard after selecting category

exports.dashboardCategory = async (req, res) => {
  const companyCategory = await Company.find({
    category: req.body.category
  }).select(["name", "shareValue", "shareCount", "previousValue"]);
  return res.send(companyCategory);
};

// news display

exports.newsDisplay = async (req, res) => {
  const news = await News.find();
  res.send(news);
};

//user leaderboard

exports.leaderboard = async (req, res) => {
  const leaderboardUsers = await User.find()
    .sort({ walletAmount: -1 })
    .select(["name", "walletAmount"]);
  return res.send(leaderboardUsers);
};

// transactions

exports.transaction = async (req, res) => {
  const userTransaction = await Transaction.find({
    userID: req.body.User_id
  });
  const user = await User.findOne({
    _id: req.body.User_id
  });
  const userCurrentHoldings = await user.currentHoldings;
  return res.send({ userTransaction, userCurrentHoldings });
};

//buy shares

exports.buyShares = async (req, res) => {
  let changedUser;
  const user = await User.findById(req.body.User_id);
  const company = await Company.findById(req.body.Company_id);
  const shareAmount = company.shareValue * req.body.shareCount;
  const currentHoldingsWanted = user.currentHoldings.find(
    p => p.Company_id.toString() == req.body.Company_id
  );
  if (req.body.shareCount > company.shareCount)
    return res.send({ message: "Enter valid number of shares..." });
  if (user.walletAmount < shareAmount)
    return res.send({ message: "user do not have required amount..." });
  if (!currentHoldingsWanted) {
    const shareAmount = company.shareValue * req.body.shareCount;
    company.shareCount = company.shareCount - req.body.shareCount;
    await Company.findByIdAndUpdate(req.body.Company_id, {
      shareCount: company.shareCount,
      currentHolders: [
        ...company.currentHolders,
        {
          User_id: req.body.User_id,
          shareCount: req.body.shareCount
        }
      ]
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

    let newHolders = company.currentHolders.filter(
      p => p.User_id.toString() != req.body.User_id.toString()
    );

    let newObj = {
      Company_id: req.body.Company_id,
      sharePrice: company.shareValue,
      shareAmount:
        (currentHoldingsWanted.shareCount + req.body.shareCount) *
        company.shareValue,
      shareCount: currentHoldingsWanted.shareCount + req.body.shareCount
    };

    let newObjCompany = {
      User_id: req.body.User_id,
      shareCount: currentHoldingsWanted.shareCount + req.body.shareCount
    };

    newHoldings.push(newObj);
    newHolders.push(newObjCompany);
    await User.findByIdAndUpdate(req.body.User_id, {
      walletAmount: walletAmount,
      currentHoldings: newHoldings
    });

    await Company.findByIdAndUpdate(req.body.Company_id, {
      shareCount: shareCount,
      currentHolders: newHolders
    });
  }
  transaction = new Transaction({
    userID: req.body.User_id,
    companyID: req.body.Company_id,
    time: new Date(),
    type: "buy",
    numberOfShares: req.body.shareCount,
    shareAmount: company.shareValue * req.body.shareCount
  });
  await transaction.save();
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
  console.log(leaderboardTop);
  await res.io.emit("global", { global: global, type: "stat" });
  changedUser = await User.findById(req.body.User_id).select([
    "walletAmount",
    "mobile",
    "currentHoldings"
  ]);
  await res.io.emit("user", { user: changedUser, type: "stat" });
  changedCompany = await Company.findById(req.body.Company_id).select([
    "shareValue",
    "shareCount",
    "previousValue"
  ]);
  await res.io.emit("company", {
    company: changedCompany,
    type: "company stat"
  });
  console.log(changedCompany);
  console.log(changedUser);
  res.send({ message: "Shares bought sucessfully..." });
};

//sell shares

exports.sellShares = async (req, res) => {
  const user = await User.findById(req.body.User_id);
  const company = await Company.findById(req.body.Company_id);
  const currentHoldingsWanted = user.currentHoldings.find(
    p => p.Company_id.toString() == req.body.Company_id
  );
  if (!currentHoldingsWanted)
    return res.send({ message: "do not have shares to sell" });
  if (currentHoldingsWanted.shareCount < req.body.shareCount)
    return res.send({ message: "do not have enough shares to sell" });
  if (currentHoldingsWanted.shareCount == req.body.shareCount) {
    let newHoldings = user.currentHoldings.filter(
      p => p.Company_id.toString() != req.body.Company_id.toString()
    );

    let newHolders = company.currentHolders.filter(
      p => p.User_id.toString() != req.body.User_id.toString()
    );

    let walletAmount =
      company.shareValue * req.body.shareCount + user.walletAmount;

    await User.findByIdAndUpdate(req.body.User_id, {
      walletAmount: walletAmount,
      currentHoldings: newHoldings
    });

    await Company.findByIdAndUpdate(req.body.Company_id, {
      shareCount: company.shareCount + req.body.shareCount,
      currentHolders: newHolders
    });
  } else {
    let newHoldings = user.currentHoldings.filter(
      p => p.Company_id.toString() != req.body.Company_id.toString()
    );

    let newHolders = company.currentHolders.filter(
      p => p.User_id.toString() != req.body.User_id.toString()
    );

    let newObj = {
      Company_id: req.body.Company_id,
      sharePrice: company.shareValue,
      shareAmount:
        (currentHoldingsWanted.shareCount - req.body.shareCount) *
        company.shareValue,
      shareCount: currentHoldingsWanted.shareCount - req.body.shareCount
    };

    let newObjCompany = {
      User_id: req.body.User_id,
      shareCount: currentHoldingsWanted.shareCount - req.body.shareCount
    };

    newHoldings.push(newObj);
    newHolders.push(newObjCompany);

    let walletAmount =
      company.shareValue * req.body.shareCount + user.walletAmount;

    await User.findByIdAndUpdate(req.body.User_id, {
      walletAmount: walletAmount,
      currentHoldings: newHoldings
    });

    await Company.findByIdAndUpdate(req.body.Company_id, {
      shareCount: company.shareCount + req.body.shareCount,
      currentHolders: newHolders
    });
  }
  transaction = new Transaction({
    userID: req.body.User_id,
    companyID: req.body.Company_id,
    time: new Date(),
    type: "sell",
    numberOfShares: req.body.shareCount,
    shareAmount: company.shareValue * req.body.shareCount
  });
  await transaction.save();
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
  changedUser = await User.findById(req.body.User_id).select([
    "walletAmount",
    "mobile",
    "currentHoldings"
  ]);
  await res.io.emit("user", { user: changedUser, type: "stat" });
  changedCompany = await Company.findById(req.body.Company_id).select([
    "shareValue",
    "shareCount",
    "previousValue"
  ]);
  await res.io.emit("company", {
    company: changedCompany,
    type: "company stat"
  });
  console.log(changedUser);
  console.log(changedCompany);
  res.send({ message: "Shares Sold Successfully" });
};

// add to watchlist

exports.addToWatchlist = async (req, res) => {
  const user = await User.findOne({
    mobile: req.body.mobile
  });
  const company = await Company.findById(req.body.Company_id).select([
    "name",
    "shareValue",
    "previousValue"
  ]);
  let flag = 0;
  user.watchList.forEach(p => {
    if (p.name === company.name) flag = 1;
  });
  if (flag === 0) {
    const shareValueChange =
      company.shareValue -
      company.previousValue[company.previousValue.length - 1];
    const shareValuePercentage = (shareValueChange / company.shareValue) * 100;
    await User.findByIdAndUpdate(user._id, {
      watchList: [
        ...user.watchList,
        {
          name: company.name,
          shareValue: company.shareValue,
          shareValuePercentage
        }
      ]
    });
  } else return res.send("company already exist in watchlist");
  res.send({ message: "added to watchlist sucessfully" });
};

// remove from watchlist

exports.removeFromWatchlist = async (req, res) => {
  const user = await User.findOne({
    mobile: req.body.mobile
  });
  if (!user) return res.send({ message: "user not present in database..." });
  let newWatchlist = user.watchList.filter(
    p =>
      p.name.toLowerCase().toString() !=
      req.body.Company_name.toLowerCase().toString()
  );
  await User.findByIdAndUpdate(user._id, {
    watchList: newWatchlist
  });
  res.send({ message: "removed from watchlist sucessfully" });
};
