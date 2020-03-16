let { User, Company, } = require("../models");

function global() { 
    const grossingCompany = await Company.find()
    .sort({ shareValue: -1 })
    .limit(1)
    .select("name");
  const leaderboardTop = await User.find()
    .sort({ walletAmount: -1 })
    .limit(1)
    .select(["name", "walletAmount"]);
 return {
    leaderboardTop,
    grossingCompany
  }
}
module.exports = { global: global };
