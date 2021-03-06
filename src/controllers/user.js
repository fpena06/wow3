let { User, Company, Transaction, News, Watchlist } = require("../models");
const config = require("config");
const jwt = require("jsonwebtoken");

//get end time

exports.time = async (req, res) => {
  const time = config.get("ENDTIME");
  res.send({ message: "Hey there", time });
};

// user login

exports.login = async (req, res) => {
  try {
    const user = await User.findOne({
      mobile: req.body.mobile,
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
          token,
        });
      } else return res.send({ message: "incorrect password" });
    }
  } catch (ex) {
    console.log(ex);
    res.send({ message: "Internal Server Error" });
  }
};

//user change password

exports.changePassword = async (req, res) => {
  try {
    const user = await User.findOne({
      mobile: req.body.mobile,
    });
    if (user.password != req.body.oldPassword) {
      return res.send({
        message: "old password is incorrect. please enter valid password",
      });
    }
    user.password = req.body.newPassword;
    await user.save();
    res.send({ message: "password updated successfully" });
  } catch (ex) {
    console.log(ex);
    res.send({ message: "Internal Server Error" });
  }
};

//user dashboard stats

exports.dashboardSocket = async (data) => {
  const user = await User.findOne({
    mobile: data.mobile,
  });
  return user;
};

//user dashboard
exports.dashboard = async (req, res) => {
  try {
    const user = await User.findOne({
      mobile: req.body.mobile,
    });
    const userWalletAmount = user.walletAmount;
    const grossingCompany = await Company.find()
      .sort({ shareValue: -1 })
      .limit(1)
      .select("name");
    let userShareAmount = 0;
    let len = user.currentHoldings.length;
    for (let i = 0; i < len; i++) {
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
      leaderboardTop,
    });
  } catch (ex) {
    console.log(ex);
    res.send({ message: "Internal Server Error" });
  }
};

// user dashboard for category

exports.category = async (req, res) => {
  try {
    let companies = await Company.find();

    let uniqueCategory = [...new Set(companies.map((c) => c.category))];
    res.send(uniqueCategory);
  } catch (ex) {
    console.log(ex);
    res.send({ message: "Internal Server Error" });
  }
};

//single company

exports.singleCompany = async (req, res) => {
  try {
    let decoded = await jwt.decode(
      req.headers["x-access-token"],
      config.get("TOKEN")
    );
    const company1 = await Company.findById(req.body.Company_id).select([
      "name",
      "shareValue",
      "shareCount",
      "previousValue",
    ]);

    const user = await User.findOne({ mobile: decoded.mobile });
    const userCurrentHoldings = user.currentHoldings;

    let foundCompany = userCurrentHoldings.find(
      (p) => p.Company_id.toString() == company1._id.toString()
    );
    let company = {
      _id: company1._id,
      name: company1.name,
      shareValue: company1.shareValue,
      shareCount: company1.shareCount,
      previousValue: company1.previousValue,
      boughtVolume: foundCompany ? foundCompany.shareCount : 0,
    };
    return res.send({ company });
  } catch (ex) {
    console.log(ex);
    res.send({ message: "Internal Server Error" });
  }
};

//user dashboard after selecting category

exports.dashboardCategory = async (req, res) => {
  try {
    let decoded = await jwt.decode(
      req.headers["x-access-token"],
      config.get("TOKEN")
    );
    const companyCategory = await Company.find({
      category: req.body.category,
    }).select(["name", "shareValue", "shareCount", "previousValue"]);

    const user = await User.findOne({ mobile: decoded.mobile });
    const userCurrentHoldings = user.currentHoldings;

    let xyz = await companyCategory.map((company) => {
      let foundCompany = userCurrentHoldings.find(
        (p) => p.Company_id.toString() == company._id.toString()
      );
      let obj = {
        _id: company._id,
        name: company.name,
        shareValue: company.shareValue,
        shareCount: company.shareCount,
        previousValue: company.previousValue,
        boughtVolume: foundCompany ? foundCompany.shareCount : 0,
      };

      return obj;
    });
    return res.send({ companies: xyz });
  } catch (ex) {
    console.log(ex);
    res.send({ message: "Internal Server Error" });
  }
};

// news display

exports.newsDisplay = async (req, res) => {
  try {
    const news = await News.find().limit(10).sort({ time: -1 });
    res.send(news);
  } catch (ex) {
    console.log(ex);
    res.send({ message: "Internal Server Error" });
  }
};

//user leaderboard

exports.leaderboard = async (req, res) => {
  try {
    let user = await jwt.decode(
      req.headers["x-access-token"],
      config.get("TOKEN")
    );
    let leaderboardUsers = await User.find()
      .sort({ walletAmount: -1 })
      .select(["_id", "name", "walletAmount", "mobile"]);

    let leaderboardUsers2 = [];
    let len = leaderboardUsers.length;
    for (let i = 0; i < len; i++) {
      let transaction = await Transaction.findOne({
        userID: leaderboardUsers[i]._id.toString(),
      });
      if (transaction) {
        leaderboardUsers2.push(leaderboardUsers[i]);
      }
    }

    let top10 = leaderboardUsers2.filter((a, i) => {
      if (i <= 9) {
        return a;
      }
    });
    let rank = leaderboardUsers2.findIndex((p) => p.mobile === user.mobile) + 1;

    return res.send({ leaderboardUsers: top10, rank });
  } catch (ex) {
    console.log(ex);
    res.send({ message: "Internal Server Error" });
  }
};

// transactions

exports.transaction = async (req, res) => {
  try {
    const userTransactions = await Transaction.find({
      userID: req.body.User_id,
    }).sort({ time: -1 });

    let userTransaction = [];
    let userCurrentHoldings = [];
    let company;
    let sharePrice;
    let t;
    let c;
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

    let user = await User.findById(req.body.User_id);
    let len1 = user.currentHoldings.length;
    for (let i = 0; i < len1; i++) {
      c = user.currentHoldings[i];
      company = await Company.findById(c.Company_id.toString());

      userCurrentHoldings.push({
        company_id: c.Company_id,
        companyName: company.name,
        shareCount: c.shareCount,
      });
    }
    return res.send({
      userTransaction: userTransaction,
      userCurrentHoldings: userCurrentHoldings,
    });
  } catch (ex) {
    console.log(ex);
    res.send({ message: "Internal Server Error" });
  }
};

//buy shares

exports.buyShares = async (req, res) => {
  try {
    if (req.body.shareCount < 0) {
      return res.send({ message: "Enter Vaid number of Shares" });
    }
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
      "currentHoldings.Company_id": req.body.Company_id,
    }).select("currentHoldings");

    if (!existingCompanies) {
      newCurrentHolding = {
        Company_id: req.body.Company_id,
        sharePrice: companyShareValue,
        shareAmount: calculatedShareAmt,
        shareCount: userShareCount,
      };
      await User.findByIdAndUpdate(req.body.User_id, {
        walletAmount: newWalletAmt,
        $push: { currentHoldings: newCurrentHolding },
      });
    } else {
      const existingCompany = existingCompanies.currentHoldings.find(
        (c) => c.Company_id.toString() === req.body.Company_id
      );

      newCurrentHolding = {
        Company_id: req.body.Company_id,
        sharePrice: companyShareValue,
        shareAmount: existingCompany.shareAmount + calculatedShareAmt,
        shareCount: existingCompany.shareCount + userShareCount,
      };

      await User.findByIdAndUpdate(req.body.User_id, {
        $pull: { currentHoldings: { Company_id: req.body.Company_id } },
      });

      await User.findByIdAndUpdate(req.body.User_id, {
        walletAmount: newWalletAmt,
        $push: { currentHoldings: newCurrentHolding },
      });
    }

    await Company.findByIdAndUpdate(req.body.Company_id, {
      shareCount: companyShareCount - userShareCount,
    });

    const currentTime = new Date();
    const currentOffset = currentTime.getTimezoneOffset();
    const ISTOffset = 330;

    let transaction = new Transaction({
      userID: req.body.User_id,
      companyID: req.body.Company_id,
      time: new Date(
        currentTime.getTime() + (ISTOffset + currentOffset) * 60000
      ),
      type: "buy",
      numberOfShares: userShareCount,
      shareAmount: calculatedShareAmt,
    });

    transaction.save();

    res.io.emit("user", { type: "company" });
    res.io.emit("global", {
      type: "company",
      Company_id: company._id.toString(),
    });
    res.io.emit("global", { type: "stat" });
    res.io.emit("user", { type: "stat" });
    res.send({ message: "Shares bought sucessfully..." });
  } catch (ex) {
    console.log(ex);
    res.send({ message: "Internal Server Error" });
  }
};

//sell shares

exports.sellShares = async (req, res) => {
  try {
    if (req.body.shareCount < 0) {
      return res.send({ message: "Enter Vaid number of Shares" });
    }
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

    const newWalletAmt = userCurrentWalletAmt + calculatedShareAmt;
    let newCurrentHolding;

    const existingCompanies = await User.findOne({
      _id: req.body.User_id,
      "currentHoldings.Company_id": req.body.Company_id,
    }).select("currentHoldings");

    if (!existingCompanies) {
      return res.send({ message: "Do not have shares to sell..." });
    }

    const shareAvilWithUser = existingCompanies.currentHoldings.find(
      (p) => p.Company_id.toString() == req.body.Company_id.toString()
    );

    if (shareAvilWithUser.shareCount < req.body.shareCount) {
      return res.send({ message: "user do not have required shares..." });
    }

    if (shareAvilWithUser.shareCount === req.body.shareCount) {
      await User.findByIdAndUpdate(req.body.User_id, {
        walletAmount: newWalletAmt,
        $pull: { currentHoldings: { Company_id: req.body.Company_id } },
      });
    } else {
      newCurrentHolding = {
        Company_id: req.body.Company_id,
        sharePrice: companyShareValue,
        shareAmount: shareAvilWithUser.shareAmount - calculatedShareAmt,
        shareCount: shareAvilWithUser.shareCount - userShareCount,
      };

      await User.findByIdAndUpdate(req.body.User_id, {
        $pull: { currentHoldings: { Company_id: req.body.Company_id } },
      });

      await User.findByIdAndUpdate(req.body.User_id, {
        walletAmount: newWalletAmt,
        $push: { currentHoldings: newCurrentHolding },
      });
    }

    await Company.findByIdAndUpdate(req.body.Company_id, {
      shareCount: companyShareCount + userShareCount,
    });

    const currentTime = new Date();
    const currentOffset = currentTime.getTimezoneOffset();
    const ISTOffset = 330;

    let transaction = new Transaction({
      userID: req.body.User_id,
      companyID: req.body.Company_id,
      time: new Date(
        currentTime.getTime() + (ISTOffset + currentOffset) * 60000
      ),
      type: "sell",
      numberOfShares: userShareCount,
      shareAmount: calculatedShareAmt,
    });

    transaction.save();

    res.io.emit("user", { type: "company" });
    res.io.emit("global", {
      type: "company",
      Company_id: company._id.toString(),
    });
    res.io.emit("global", { type: "stat" });
    res.io.emit("user", { type: "stat" });
    res.send({ message: "Shares Sold Successfully" });
  } catch (ex) {
    console.log(ex);
    res.send({ message: "Internal Server Error" });
  }
};

// add to watchlist

exports.addToWatchlist = async (req, res) => {
  try {
    const user = await User.findOne({
      mobile: req.body.mobile,
    });
    let checkWatchlist = await Watchlist.findOne({
      Company_id: req.body.Company_id,
      User_id: user._id.toString(),
    });
    if (!checkWatchlist) {
      watchlist = new Watchlist({
        Company_id: req.body.Company_id,
        User_id: user._id,
      });
      await watchlist.save();
    } else return res.send({ message: "company already exist in watchlist" });
    await res.io.emit("user", { type: "watchlist", message: user.mobile });
    res.send({ message: "added to watchlist sucessfully" });
  } catch (ex) {
    console.log(ex);
    res.send({ message: "Internal Server Error" });
  }
};

// remove from watchlist

exports.removeFromWatchlist = async (req, res) => {
  try {
    const user = await User.findOne({
      mobile: req.body.mobile,
    });
    let checkWatchlist = await Watchlist.findOne({
      Company_id: req.body.Company_id,
      User_id: user._id.toString(),
    });
    if (!user) return res.send({ message: "user not present in database..." });
    if (!checkWatchlist)
      return res.send({ message: "company not present in watchlist" });
    await Watchlist.findByIdAndDelete(checkWatchlist._id);
    await res.io.emit("user", { type: "watchlist", message: user.mobile });
    res.send({ message: "removed from watchlist sucessfully" });
  } catch (ex) {
    console.log(ex);
    res.send({ message: "Internal Server Error" });
  }
};

// display watchlist

exports.watchlist = async (req, res) => {
  try {
    const user = await User.findOne({ mobile: req.body.mobile });
    if (!user) return res.send({ message: "user not valid" });
    const userWatchlist = await Watchlist.find({
      User_id: user._id,
    });
    let userWatchlist1 = [];
    let len = userWatchlist.length;
    for (let i = 0; i < len; i++) {
      let c = await Company.findById(userWatchlist[i].Company_id);
      const shareValueChange =
        c.shareValue - c.previousValue[c.previousValue.length - 1].value;
      const shareValuePercentage = Number(
        ((shareValueChange / c.shareValue) * 100).toFixed()
      );
      let obj = {
        name: c.name,
        Company_id: c._id,
        shareValue: c.shareValue,
        shareValuePercentage,
      };
      userWatchlist1.push(obj);
    }
    res.send(userWatchlist1);
  } catch (ex) {
    console.log(ex);
    res.send({ message: "Internal Server Error" });
  }
};

// stockbar

exports.stockbar = async (req, res) => {
  try {
    const companies = await Company.find();
    let stockbar = [];
    let companiesLength = companies.length;
    for (let i = 0; i < companiesLength; i++) {
      let company = companies[i];
      let changeValue =
        company.shareValue -
        company.previousValue[company.previousValue.length - 1].value;
      let status = changeValue >= 0 ? "up" : "down";
      let obj = {
        companyName: company.name,
        stat: status,
      };
      stockbar.push(obj);
    }
    res.send({ stockbar });
  } catch (ex) {
    console.log(ex);
    res.send({ message: "Internal Server Error" });
  }
};
