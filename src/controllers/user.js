let { User, userValidation, Company, Transaction } = require("../models");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

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
        "TokyoGhoul"
      );
      res.header("x-auth-token", token).send("Suceefully logged in ...");
    }
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

//user dashboard

exports.dashboard = async (req, res) => {
  const user = await User.findOne({
    mobile: req.body.mobile
  });
  const totalAmount = user.walletAmount;
  const grossingCompany = await Company.findOne()
    .sort("shareValue: 1")
    .limit(1)
    .select("name");
  const leaderboardTop = await User.findOne()
    .sort("walletAmount: 1")
    .limit(1)
    .select("name");
  return res.send({ totalAmount, grossingCompany, leaderboardTop });
};

//user dashboard after selecting category

exports.dashboardCategory = async (req, res) => {
  const companyCategory = await Company.find({
    category: req.params.category
  }).select(["name", "shareValue", "shareCount"]);
  return res.send(companyCategory);
};

//user leaderboard

exports.leaderboard = async (req, res) => {
  const leaderboardUsers = await User.find()
    .sort("walletAmount:1")
    .select(["name", "walletAmount"]);
  return res.send(leaderboardUsers);
};

// transactions

exports.transaction = async (req, res) => {
  const userTransaction = await Transaction.find({
    userID: req.body.User_id
  });
  const user = await User.find({
    _id: req.body.User_id
  });
  userCurrentHoldings = user.currentHoldings;
  return res.send({ userTransaction, userCurrentHoldings });
};

//buy shares

exports.buyShares = async (req, res) => {
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
  res.send({ message: "Shares Sold Successfully" });
};
